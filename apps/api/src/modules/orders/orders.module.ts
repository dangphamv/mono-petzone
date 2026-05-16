import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderAutoCompleteWorker } from './order-auto-complete.worker';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderAutoCompleteWorker],
  exports: [OrdersService],
})
export class OrdersModule {}
