import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/jwt-payload.interface';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  },
  customer: { select: { id: true, name: true, email: true } },
  payments: true,
  shipment: true,
} satisfies Prisma.OrderInclude;

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.CANCELLED],
  PAID: [OrderStatus.STOCK_RESERVED, OrderStatus.REFUNDED],
  STOCK_RESERVED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly productsService: ProductsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateOrderDto, customer: AuthenticatedUser) {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { inventory: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are invalid or inactive');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      if (!product.inventory) {
        throw new BadRequestException(`Product "${product.name}" has no inventory`);
      }
      this.productsService.assertAvailable(
        product.inventory,
        item.quantity,
        product.name,
      );
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = new Prisma.Decimal(0);
      const lineItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const unitPrice = product.price;
        const subtotal = unitPrice.mul(item.quantity);
        totalAmount = totalAmount.add(subtotal);

        await this.inventoryService.reserveStock(
          tx,
          product.id,
          item.quantity,
          product.name,
        );

        lineItems.push({
          product: { connect: { id: product.id } },
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      return tx.order.create({
        data: {
          customerId: customer.id,
          status: OrderStatus.PENDING_PAYMENT,
          totalAmount,
          shippingStreet: dto.shippingStreet,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState,
          shippingZip: dto.shippingZip,
          items: { create: lineItems },
        },
        include: orderInclude,
      });
    });

    await this.notificationsService.notifyOrderStatus(
      order.id,
      OrderStatus.PENDING_PAYMENT,
    );

    return order;
  }

  findAll(user: AuthenticatedUser) {
    const where =
      user.role === UserRole.CUSTOMER ? { customerId: user.id } : undefined;

    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === UserRole.CUSTOMER && order.customerId !== user.id) {
      throw new ForbiddenException('Cannot access this order');
    }

    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    user: AuthenticatedUser,
  ) {
    const order = await this.findOne(id, user);
    this.ensureCanUpdateStatus(user, dto.status);

    if (!ALLOWED_TRANSITIONS[order.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const shippingStatuses: OrderStatus[] = [
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    if (
      shippingStatuses.includes(dto.status) &&
      order.status === OrderStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException('Order cannot be shipped before payment');
    }

    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.STOCK_RESERVED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    if (
      shippingStatuses.includes(dto.status) &&
      !paidStatuses.includes(order.status) &&
      order.status !== OrderStatus.PROCESSING &&
      order.status !== OrderStatus.SHIPPED
    ) {
      throw new BadRequestException('Order must be paid before shipping');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (
        dto.status === OrderStatus.CANCELLED ||
        dto.status === OrderStatus.REFUNDED
      ) {
        for (const item of order.items) {
          await this.inventoryService.releaseStock(
            tx,
            item.productId,
            item.quantity,
          );
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: dto.status },
        include: orderInclude,
      });

      if (dto.status === OrderStatus.PROCESSING) {
        await tx.shipment.upsert({
          where: { orderId: id },
          create: { orderId: id, status: 'PROCESSING' },
          update: { status: 'PROCESSING' },
        });
      }

      if (dto.status === OrderStatus.SHIPPED) {
        await tx.shipment.upsert({
          where: { orderId: id },
          create: {
            orderId: id,
            status: 'SHIPPED',
            trackingCode: dto.trackingCode,
            carrier: dto.carrier,
            shippedAt: new Date(),
          },
          update: {
            status: 'SHIPPED',
            trackingCode: dto.trackingCode ?? undefined,
            carrier: dto.carrier ?? undefined,
            shippedAt: new Date(),
          },
        });
      }

      if (dto.status === OrderStatus.DELIVERED) {
        await tx.shipment.upsert({
          where: { orderId: id },
          create: {
            orderId: id,
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
          update: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        });
      }

      return updatedOrder;
    });

    await this.notificationsService.notifyOrderStatus(id, dto.status);
    return updated;
  }

  async markPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not awaiting payment');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
      include: orderInclude,
    });
  }

  private ensureCanUpdateStatus(user: AuthenticatedUser, status: OrderStatus) {
    const warehouseStatuses: OrderStatus[] = [
      OrderStatus.STOCK_RESERVED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const financeStatuses: OrderStatus[] = [OrderStatus.REFUNDED];
    const customerStatuses: OrderStatus[] = [OrderStatus.CANCELLED];

    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.WAREHOUSE && warehouseStatuses.includes(status)) {
      return;
    }

    if (user.role === UserRole.FINANCE && financeStatuses.includes(status)) {
      return;
    }

    if (
      user.role === UserRole.CUSTOMER &&
      customerStatuses.includes(status)
    ) {
      return;
    }

    throw new ForbiddenException('Cannot perform this status update');
  }
}
