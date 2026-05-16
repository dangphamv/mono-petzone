import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentsV2Service } from '../payments-v2.service';

export interface OrderV2CompletedEvent {
  order_id: string;
  actor_id: string;
}

@Injectable()
export class PaymentListener {
  private readonly logger = new Logger(PaymentListener.name);

  constructor(private readonly service: PaymentsV2Service) {}

  @OnEvent('order.v2.completed')
  async onOrderCompleted(event: OrderV2CompletedEvent) {
    // Defense in depth — listener chỉ chạy khi v2 enabled. Event fire normally
    // chỉ khi order.payment_version === 2 (đã check trong orders.service), nhưng
    // guard ở đây bắt được case admin tắt v2 mid-flight.
    if (!(await this.service.isEnabled())) {
      this.logger.warn(`[v2] order.v2.completed received but v2 is disabled — skipping enqueue for ${event.order_id}`);
      return;
    }
    this.logger.log(`[v2] order.v2.completed order=${event.order_id} → enqueue split`);
    try {
      await this.service.enqueueSplit(event.order_id);
    } catch (err) {
      this.logger.error(`enqueueSplit failed for ${event.order_id}: ${(err as Error).message}`);
    }
  }
}
