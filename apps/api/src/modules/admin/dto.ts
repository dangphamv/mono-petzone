import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyProviderDto {
  @ApiProperty({ enum: ['approved', 'rejected'], example: 'approved', description: 'Verification decision' })
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'All documents verified successfully', description: 'Admin notes (max 1000 chars)' })
  notes?: string;
}

export class RequestInfoDto {
  @ApiProperty({ example: 'Please upload a clearer photo of your business license.', description: 'Required information (1-1000 chars)' })
  requirements: string;
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

export class AdminMessageDto {
  @ApiProperty({ example: 'Please resolve this issue between yourselves or contact support.', description: 'Mediation message (1-2000 chars)' })
  message: string;
}

export class AdminCreateOrderDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Owner user ID' })
  owner_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Provider ID' })
  provider_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Room type ID' })
  room_type_id: string;

  @ApiProperty({ type: [String], example: ['550e8400-e29b-41d4-a716-446655440003'], description: 'Pet IDs (1-10)' })
  pet_ids: string[];

  @ApiProperty({ example: '2026-06-01', description: 'Check-in date (YYYY-MM-DD)' })
  check_in_date: string;

  @ApiProperty({ example: '2026-06-05', description: 'Check-out date (YYYY-MM-DD)' })
  check_out_date: string;

  @ApiProperty({ type: [String], example: [], description: 'Add-on service IDs (max 20)' })
  add_on_ids: string[];

  @ApiPropertyOptional({ example: 'Pet has special diet requirements', description: 'Special notes (max 1000 chars)' })
  special_notes?: string;

  @ApiProperty({ example: true, description: 'Whether to receive daily status reports', default: true })
  daily_status_report: boolean;
}
