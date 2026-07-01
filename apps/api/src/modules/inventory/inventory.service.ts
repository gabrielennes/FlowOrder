import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { UpdateInventoryDto } from '../products/dto/products.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  findAll() {
    return this.prisma.inventory.findMany({
      include: {
        product: {
          select: { id: true, name: true, sku: true, active: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByProductId(productId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
      include: {
        product: {
          select: { id: true, name: true, sku: true, active: true },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for product');
    }

    return {
      ...inventory,
      available: this.productsService.getAvailableQuantity(inventory),
    };
  }

  async updateQuantity(productId: string, dto: UpdateInventoryDto) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for product');
    }

    if (dto.quantity < inventory.reservedQuantity) {
      throw new BadRequestException(
        `Quantity cannot be less than reserved amount (${inventory.reservedQuantity})`,
      );
    }

    return this.prisma.inventory.update({
      where: { productId },
      data: { quantity: dto.quantity },
      include: {
        product: {
          select: { id: true, name: true, sku: true, active: true },
        },
      },
    });
  }

  async reserveStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    productName: string,
  ) {
    const inventory = await tx.inventory.findUnique({ where: { productId } });

    if (!inventory) {
      throw new NotFoundException(`Inventory not found for product ${productName}`);
    }

    this.productsService.assertAvailable(inventory, quantity, productName);

    return tx.inventory.update({
      where: { productId },
      data: { reservedQuantity: { increment: quantity } },
    });
  }

  async releaseStock(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    const inventory = await tx.inventory.findUnique({ where: { productId } });
    if (!inventory) return;

    const releaseQty = Math.min(quantity, inventory.reservedQuantity);

    return tx.inventory.update({
      where: { productId },
      data: { reservedQuantity: { decrement: releaseQty } },
    });
  }
}
