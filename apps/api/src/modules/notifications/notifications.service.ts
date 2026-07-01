import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifyOrderStatus(orderId: string, status: OrderStatus) {
    this.logger.log(`Order ${orderId} status changed to ${status}`);
    return { orderId, status, sent: true };
  }
}
