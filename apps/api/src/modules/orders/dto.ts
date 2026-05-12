import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Provider UUID' })
  provider_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Room type UUID' })
  room_type_id: string;

  @ApiProperty({ example: ['550e8400-e29b-41d4-a716-446655440010'], description: 'Pet UUIDs (min 1)', type: [String] })
  pet_ids: string[];

  @ApiProperty({ example: '2026-04-15', description: 'Check-in date (YYYY-MM-DD)' })
  check_in_date: string;

  @ApiProperty({ example: '2026-04-18', description: 'Check-out date (YYYY-MM-DD)' })
  check_out_date: string;

  @ApiProperty({ example: [], description: 'Add-on service UUIDs', type: [String], default: [] })
  add_on_ids: string[];

  @ApiPropertyOptional({ example: 'Please give extra attention to my dog, he is anxious.', description: 'Special notes (max 1000 chars)', maxLength: 1000 })
  special_notes?: string;

  @ApiProperty({ example: true, description: 'Request daily status reports', default: true })
  daily_status_report: boolean;
}

export class CalculatePriceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Provider UUID' })
  provider_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Room type UUID' })
  room_type_id: string;

  @ApiProperty({ example: ['550e8400-e29b-41d4-a716-446655440010'], description: 'Pet UUIDs', type: [String] })
  pet_ids: string[];

  @ApiProperty({ example: '2026-04-15', description: 'Check-in date' })
  check_in_date: string;

  @ApiProperty({ example: '2026-04-18', description: 'Check-out date' })
  check_out_date: string;

  @ApiProperty({ example: [], description: 'Add-on service UUIDs', type: [String], default: [] })
  add_on_ids: string[];
}

export class CancelOrderDto {
  @ApiProperty({ example: 'Change of plans, need to reschedule.', description: 'Cancellation reason', minLength: 1, maxLength: 500 })
  reason: string;
}

export class DeclineOrderDto {
  @ApiProperty({ example: 'No capacity available for these dates.', description: 'Decline reason', minLength: 1, maxLength: 500 })
  reason: string;
}

export class CheckOutOrderDto {
  @ApiProperty({ example: ['https://storage.example.com/checkout1.jpg'], description: 'Check-out photo URLs (1-5)', type: [String] })
  photos: string[];

  @ApiPropertyOptional({ example: 'Pet is healthy and happy.', description: 'Check-out note', maxLength: 500 })
  note?: string;
}

export class CheckInOrderDto {
  @ApiProperty({ example: ['https://storage.example.com/checkin1.jpg'], description: 'Pet handoff photo URLs (1-5)', type: [String] })
  photos: string[];

  @ApiPropertyOptional({ example: 'Pet arrived calm, no visible injuries. Owner left dry food (Royal Canin).', description: 'Notes recorded at handoff (pet condition, instructions)', maxLength: 500 })
  note?: string;

  @ApiPropertyOptional({ example: 10.8231, description: 'Latitude at handoff location' })
  latitude?: number;

  @ApiPropertyOptional({ example: 106.6297, description: 'Longitude at handoff location' })
  longitude?: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'confirmed', description: 'New order status', enum: ['confirmed', 'checked_in', 'in_progress', 'check_out', 'completed'] })
  status: 'confirmed' | 'checked_in' | 'in_progress' | 'check_out' | 'completed';

  @ApiPropertyOptional({ example: 'Pet checked in at front desk', description: 'Optional note', maxLength: 500 })
  note?: string;
}
