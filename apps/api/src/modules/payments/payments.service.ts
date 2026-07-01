import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/jwt-payload.interface';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(user: AuthenticatedUser) {
    if (user.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Customers cannot list all payments');
    }

    return this.prisma.payment.findMany({
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrder(orderId: string, user: AuthenticatedUser) {
    const order = await this.ordersService.findOne(orderId, user);

    return this.prisma.payment.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePaymentDto, user: AuthenticatedUser) {
    const order = await this.ordersService.findOne(dto.orderId, user);

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not awaiting payment');
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        method: dto.method,
        status: PaymentStatus.PENDING,
      },
    });

    return this.approve(payment.id, user);
  }

  async approve(paymentId: string, user: AuthenticatedUser) {
    if (
      user.role !== UserRole.CUSTOMER &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.FINANCE
    ) {
      throw new ForbiddenException('Cannot approve payments');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (user.role === UserRole.CUSTOMER && payment.order.customerId !== user.id) {
      throw new ForbiddenException('Cannot approve this payment');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }

    const [approvedPayment] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.APPROVED,
          paidAt: new Date(),
          externalId: `mock_${paymentId.slice(0, 8)}`,
        },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
      }),
    ]);

    await this.notificationsService.notifyOrderStatus(
      payment.orderId,
      OrderStatus.PAID,
    );

    return approvedPayment;
  }
}
