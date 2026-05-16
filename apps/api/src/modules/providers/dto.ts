import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterProviderDto {
  @ApiProperty({ example: 'Happy Paws Hotel', description: 'Business name', minLength: 2, maxLength: 200 })
  business_name: string;

  @ApiPropertyOptional({ example: 'A cozy pet hotel in District 1', description: 'Business description', maxLength: 2000 })
  description?: string;

  @ApiPropertyOptional({ example: 'BL-2024-001', description: 'Business license number', maxLength: 100 })
  license_number?: string;

  @ApiProperty({ example: ['https://storage.example.com/license1.jpg'], description: 'License photo URLs (1-3)', type: [String], minItems: 1, maxItems: 3 })
  license_photos: string[];

  @ApiProperty({ example: '123 Nguyen Hue, District 1, HCMC', description: 'Business address', minLength: 5, maxLength: 500 })
  address: string;

  @ApiProperty({ example: 10.7769, description: 'Latitude (-90 to 90)', minimum: -90, maximum: 90 })
  latitude: number;

  @ApiProperty({ example: 106.7009, description: 'Longitude (-180 to 180)', minimum: -180, maximum: 180 })
  longitude: number;

  @ApiPropertyOptional({ example: '0901234567', description: 'Contact phone number' })
  phone?: string;

  @ApiProperty({ example: ['https://storage.example.com/facility1.jpg'], description: 'Facility photo URLs (5-30)', type: [String], minItems: 5, maxItems: 30 })
  facility_photos: string[];

  @ApiProperty({ example: [], description: 'Certification photo URLs (max 10)', type: [String], maxItems: 10, default: [] })
  certification_photos: string[];

  @ApiProperty({ example: ['dog', 'cat'], description: 'Accepted pet species (min 1)', enum: ['dog', 'cat', 'other'], isArray: true })
  accepted_species: ('dog' | 'cat' | 'other')[];

  @ApiPropertyOptional({ example: 2, description: 'Minimum weight limit in kg' })
  weight_limit_min_kg?: number;

  @ApiPropertyOptional({ example: 40, description: 'Maximum weight limit in kg' })
  weight_limit_max_kg?: number;

  @ApiProperty({ example: 'flexible', description: 'Cancellation policy', enum: ['flexible', 'moderate', 'strict'], default: 'flexible' })
  cancellation_policy: 'flexible' | 'moderate' | 'strict';
}

export class UpdateListingDto {
  @ApiPropertyOptional({ example: 'Happy Paws Hotel', description: 'Business name', minLength: 2, maxLength: 200 })
  business_name?: string;

  @ApiPropertyOptional({ example: 'A cozy pet hotel in District 1', description: 'Business description', maxLength: 2000 })
  description?: string;

  @ApiPropertyOptional({ example: 'BL-2024-001', description: 'Business license number', maxLength: 100 })
  license_number?: string;

  @ApiPropertyOptional({ example: ['https://storage.example.com/license1.jpg'], description: 'License photo URLs (1-3)', type: [String] })
  license_photos?: string[];

  @ApiPropertyOptional({ example: '123 Nguyen Hue, District 1, HCMC', description: 'Business address', minLength: 5, maxLength: 500 })
  address?: string;

  @ApiPropertyOptional({ example: 10.7769, description: 'Latitude (-90 to 90)', minimum: -90, maximum: 90 })
  latitude?: number;

  @ApiPropertyOptional({ example: 106.7009, description: 'Longitude (-180 to 180)', minimum: -180, maximum: 180 })
  longitude?: number;

  @ApiPropertyOptional({ example: '0901234567', description: 'Contact phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: ['https://storage.example.com/facility1.jpg'], description: 'Facility photo URLs (5-30)', type: [String] })
  facility_photos?: string[];

  @ApiPropertyOptional({ example: [], description: 'Certification photo URLs (max 10)', type: [String] })
  certification_photos?: string[];

  @ApiPropertyOptional({ example: ['dog', 'cat'], description: 'Accepted pet species (min 1)', enum: ['dog', 'cat', 'other'], isArray: true })
  accepted_species?: ('dog' | 'cat' | 'other')[];

  @ApiPropertyOptional({ example: 2, description: 'Minimum weight limit in kg' })
  weight_limit_min_kg?: number;

  @ApiPropertyOptional({ example: 40, description: 'Maximum weight limit in kg' })
  weight_limit_max_kg?: number;

  @ApiPropertyOptional({ example: 'flexible', description: 'Cancellation policy', enum: ['flexible', 'moderate', 'strict'] })
  cancellation_policy?: 'flexible' | 'moderate' | 'strict';
}

export class UploadDocumentsDto {
  @ApiPropertyOptional({ example: ['https://storage.example.com/license1.jpg'], description: 'License photo URLs (max 3)', type: [String] })
  license_photos?: string[];

  @ApiPropertyOptional({ example: ['https://storage.example.com/facility1.jpg'], description: 'Facility photo URLs (max 30)', type: [String] })
  facility_photos?: string[];

  @ApiPropertyOptional({ example: [], description: 'Certification photo URLs (max 10)', type: [String] })
  certification_photos?: string[];
}

export class CreateRoomDto {
  @ApiProperty({ example: 'Deluxe Suite', description: 'Room name', minLength: 1, maxLength: 100 })
  name: string;

  @ApiPropertyOptional({ example: 'Spacious room with AC and camera', description: 'Room description', maxLength: 500 })
  description?: string;

  @ApiProperty({ example: 1, description: 'Room capacity', default: 1 })
  capacity: number;

  @ApiProperty({ example: 350000, description: 'Price per night in VND (50,000 - 10,000,000)', minimum: 50000, maximum: 10000000 })
  price_per_night: number;

  @ApiProperty({ example: [], description: 'Room photo URLs (max 5)', type: [String], maxItems: 5, default: [] })
  photos: string[];
}

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: 'Deluxe Suite', description: 'Room name', minLength: 1, maxLength: 100 })
  name?: string;

  @ApiPropertyOptional({ example: 'Spacious room with AC and camera', description: 'Room description', maxLength: 500 })
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'Room capacity' })
  capacity?: number;

  @ApiPropertyOptional({ example: 350000, description: 'Price per night in VND (50,000 - 10,000,000)', minimum: 50000, maximum: 10000000 })
  price_per_night?: number;

  @ApiPropertyOptional({ example: [], description: 'Room photo URLs (max 5)', type: [String] })
  photos?: string[];
}

export class CreateAddOnDto {
  @ApiProperty({ example: 'Grooming', description: 'Add-on service name', minLength: 1, maxLength: 100 })
  name: string;

  @ApiPropertyOptional({ example: 'Full bath and hair trim', description: 'Add-on description', maxLength: 500 })
  description?: string;

  @ApiProperty({ example: 150000, description: 'Price in VND (must be positive)' })
  price: number;

  @ApiProperty({ example: 'per_booking', description: 'Price type', enum: ['per_night', 'per_booking', 'per_pet'] })
  price_type: 'per_night' | 'per_booking' | 'per_pet';
}

export class UpdateAddOnDto {
  @ApiPropertyOptional({ example: 'Grooming', description: 'Add-on service name', minLength: 1, maxLength: 100 })
  name?: string;

  @ApiPropertyOptional({ example: 'Full bath and hair trim', description: 'Add-on description', maxLength: 500 })
  description?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Price in VND (must be positive)' })
  price?: number;

  @ApiPropertyOptional({ example: 'per_booking', description: 'Price type', enum: ['per_night', 'per_booking', 'per_pet'] })
  price_type?: 'per_night' | 'per_booking' | 'per_pet';
}

export class AvailabilityDateDto {
  @ApiProperty({ example: '2026-04-15', description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: 3, description: 'Number of available slots' })
  available_slots: number;

  @ApiProperty({ example: false, description: 'Whether the date is blocked' })
  is_blocked: boolean;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Room type UUID' })
  room_type_id: string;

  @ApiProperty({ type: [AvailabilityDateDto], description: 'Array of date availability entries' })
  dates: AvailabilityDateDto[];
}

export class VerificationStatusResponseDto {
  @ApiProperty({
    example: 'pending',
    description: 'Provider verification status',
    enum: ['pending', 'approved', 'rejected', 'suspended'],
  })
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';

  @ApiPropertyOptional({ example: '2026-01-13T15:30:00.000Z', description: 'Approval timestamp (only when approved)', nullable: true })
  verified_at?: string | null;
}

export class UpdateProviderBankDto {
  @ApiProperty({ example: 'Vietcombank', description: 'Bank name', maxLength: 100 })
  bank_name: string;

  @ApiProperty({ example: '0123456789012', description: 'Bank account number (6-20 digits)' })
  bank_account_number: string;

  @ApiProperty({ example: 'NGUYEN VAN A', description: 'Account holder name', maxLength: 200 })
  bank_account_holder: string;
}

export class BulkUpdateAvailabilityDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Room type UUID' })
  room_type_id: string;

  @ApiProperty({ example: '2026-04-15', description: 'Start date (YYYY-MM-DD)' })
  start_date: string;

  @ApiProperty({ example: '2026-04-30', description: 'End date (YYYY-MM-DD)' })
  end_date: string;

  @ApiProperty({ example: 3, description: 'Available slots for each date' })
  available_slots: number;

  @ApiProperty({ example: false, description: 'Whether to block the dates', default: false })
  is_blocked: boolean;
}
