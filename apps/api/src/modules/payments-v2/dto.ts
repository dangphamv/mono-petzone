import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentV2Dto {
  @ApiProperty({ example: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', description: 'Order ID (must have payment_version=2)' })
  order_id!: string;

  @ApiProperty({ example: 'momo', enum: ['momo', 'zalopay', 'vnpay', 'card', 'bank_transfer'] })
  method!: 'momo' | 'zalopay' | 'vnpay' | 'card' | 'bank_transfer';

  @ApiProperty({ example: 'https://app.petzone.vn/orders/eee/done', required: false })
  return_url?: string;
}

export class RefundV2Dto {
  @ApiProperty({ example: 600000, description: 'Refund amount in VND' })
  amount!: number;

  @ApiProperty({ example: 'Customer cancelled within policy window' })
  reason!: string;
}
