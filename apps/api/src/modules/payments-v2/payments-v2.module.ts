import { Module } from '@nestjs/common';
import { PspModule } from './psp/psp.module';
import { PaymentsV2Service } from './payments-v2.service';
import { PaymentsV2Controller } from './payments-v2.controller';
import { PaymentListener } from './listeners/payment.listener';
import { DisbursementWorker } from './disbursement.worker';

@Module({
  imports: [PspModule],
  controllers: [PaymentsV2Controller],
  providers: [PaymentsV2Service, PaymentListener, DisbursementWorker],
  exports: [PaymentsV2Service],
})
export class PaymentsV2Module {}
