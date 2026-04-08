import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Order ID to pay for' })
  order_id: string;

  @ApiProperty({ enum: ['momo', 'zalopay', 'vnpay', 'bank_transfer'], example: 'momo', description: 'Payment method' })
  method: 'momo' | 'zalopay' | 'vnpay' | 'bank_transfer';

  @ApiPropertyOptional({ example: 'https://example.com/payment/callback', description: 'URL to redirect after payment' })
  return_url?: string;
}

export class RefundDto {
  @ApiProperty({ example: 150000, description: 'Refund amount (positive number)' })
  amount: number;

  @ApiProperty({ example: 'Service not as described', description: 'Reason for refund (1-500 chars)' })
  reason: string;

  @ApiProperty({ enum: ['full', 'partial'], example: 'partial', description: 'Refund type' })
  type: 'full' | 'partial';
}
