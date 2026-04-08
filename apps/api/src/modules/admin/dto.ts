import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyProviderDto {
  @ApiProperty({ enum: ['approved', 'rejected'], example: 'approved', description: 'Verification decision' })
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'All documents verified successfully', description: 'Admin notes (max 1000 chars)' })
  notes?: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ example: 'Refund issued to owner. Provider warned.', description: 'Resolution details (1-2000 chars)' })
  resolution: string;

  @ApiPropertyOptional({ example: 75000, description: 'Refund amount (min 0)', minimum: 0 })
  refund_amount?: number;
}

export class SuspendUserDto {
  @ApiProperty({ example: 'Repeated policy violations', description: 'Suspension reason (1-500 chars)' })
  reason: string;

  @ApiProperty({ example: false, description: 'Whether the suspension is permanent', default: false })
  is_permanent: boolean;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ['hide', 'show'], example: 'hide', description: 'Moderation action' })
  action: 'hide' | 'show';

  @ApiPropertyOptional({ example: 'Contains inappropriate language', description: 'Reason for moderation (max 500 chars)' })
  reason?: string;
}

export class UpdateConfigDto {
  @ApiPropertyOptional({ example: 15, description: 'Commission rate percentage' })
  commission_rate?: number;

  @ApiPropertyOptional({ example: 4, description: 'Hours before auto-confirming an order' })
  auto_confirm_hours?: number;

  @ApiPropertyOptional({ example: 24, description: 'Hours before payment times out' })
  payment_timeout_hours?: number;
}
