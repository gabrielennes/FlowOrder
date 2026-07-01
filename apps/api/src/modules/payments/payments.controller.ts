import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/jwt-payload.interface';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payments.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findAll(user);
  }

  @Get('order/:orderId')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.ADMIN,
    UserRole.FINANCE,
    UserRole.WAREHOUSE,
  )
  findByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.findByOrder(orderId, user);
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.create(dto, user);
  }
}
