import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/jwt-payload.interface';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';

const productInclude = {
  inventory: true,
  createdBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(activeOnly = true) {
    return this.prisma.product.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(dto: CreateProductDto, admin: AuthenticatedUser) {
    const initialStock = dto.initialStock ?? 0;

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        sku: dto.sku,
        createdById: admin.id,
        inventory: {
          create: {
            quantity: initialStock,
            reservedQuantity: 0,
          },
        },
      },
      include: productInclude,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: productInclude,
    });
  }

  async deactivate(id: string) {
    return this.update(id, { active: false });
  }

  getAvailableQuantity(inventory: {
    quantity: number;
    reservedQuantity: number;
  }) {
    return inventory.quantity - inventory.reservedQuantity;
  }

  assertAvailable(
    inventory: { quantity: number; reservedQuantity: number },
    requested: number,
    productName: string,
  ) {
    const available = this.getAvailableQuantity(inventory);
    if (requested > available) {
      throw new BadRequestException(
        `Insufficient stock for product "${productName}". Available: ${available}`,
      );
    }
  }
}
