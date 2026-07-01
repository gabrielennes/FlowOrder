import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from '../products/dto/products.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':productId')
  findByProduct(@Param('productId') productId: string) {
    return this.inventoryService.findByProductId(productId);
  }

  @Patch(':productId')
  @Roles(UserRole.ADMIN)
  updateQuantity(
    @Param('productId') productId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateQuantity(productId, dto);
  }
}
