import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VaccinationRecordDto {
  @ApiProperty({ example: 'Rabies', description: 'Vaccine name' })
  name: string;

  @ApiProperty({ example: '2025-01-15', description: 'Vaccination date' })
  date: string;

  @ApiPropertyOptional({ example: '2026-01-15', description: 'Expiry date' })
  expiry_date?: string;

  @ApiPropertyOptional({ example: 'https://example.com/doc.pdf', description: 'Document URL', format: 'url' })
  document_url?: string;
}

export class MedicationDto {
  @ApiProperty({ example: 'Apoquel', description: 'Medication name' })
  name: string;

  @ApiProperty({ example: '16mg', description: 'Dosage' })
  dosage: string;

  @ApiProperty({ example: 'Twice daily', description: 'Frequency' })
  frequency: string;

  @ApiPropertyOptional({ example: 'Give with food', description: 'Additional notes' })
  notes?: string;
}

export class CreatePetDto {
  @ApiProperty({ example: 'Bông', description: 'Pet name', minLength: 1, maxLength: 100 })
  name: string;

  @ApiProperty({ example: 'dog', description: 'Species', enum: ['dog', 'cat', 'other'] })
  species: 'dog' | 'cat' | 'other';

  @ApiPropertyOptional({ example: 'Poodle', description: 'Breed', maxLength: 100 })
  breed?: string;

  @ApiProperty({ example: 'male', description: 'Gender', enum: ['male', 'female', 'unknown'] })
  gender: 'male' | 'female' | 'unknown';

  @ApiPropertyOptional({ example: '2022-06-15', description: 'Date of birth' })
  date_of_birth?: string;

  @ApiPropertyOptional({ example: 5.5, description: 'Weight in kg', minimum: 0, maximum: 200 })
  weight_kg?: number;

  @ApiPropertyOptional({ example: 'Brown', description: 'Color', maxLength: 50 })
  color?: string;

  @ApiProperty({ example: ['https://example.com/photo1.jpg'], description: 'Pet photos (1-10)', type: [String], minItems: 1, maxItems: 10 })
  photos: string[];

  @ApiProperty({ example: [], description: 'Vaccination records', type: [VaccinationRecordDto], default: [] })
  vaccination_records: VaccinationRecordDto[];

  @ApiProperty({ example: [], description: 'Allergies', type: [String], default: [] })
  allergies: string[];

  @ApiProperty({ example: [], description: 'Chronic conditions', type: [String], default: [] })
  chronic_conditions: string[];

  @ApiProperty({ example: [], description: 'Current medications', type: [MedicationDto], default: [] })
  current_medications: MedicationDto[];

  @ApiProperty({ example: 'unknown', description: 'Neutered status', enum: ['yes', 'no', 'unknown'], default: 'unknown' })
  is_neutered: 'yes' | 'no' | 'unknown';

  @ApiProperty({ example: 'normal', description: 'Temperament', enum: ['friendly', 'shy', 'aggressive', 'normal'], default: 'normal' })
  temperament: 'friendly' | 'shy' | 'aggressive' | 'normal';

  @ApiProperty({ example: 'depends', description: 'Sociable with other animals', enum: ['yes', 'no', 'depends'], default: 'depends' })
  sociable_with_others: 'yes' | 'no' | 'depends';

  @ApiPropertyOptional({ example: 'Needs insulin injection twice daily', description: 'Special needs notes', maxLength: 1000 })
  special_needs_notes?: string;

  @ApiPropertyOptional({ example: 'Dr. Trần', description: 'Emergency vet name', maxLength: 200 })
  emergency_vet_name?: string;

  @ApiPropertyOptional({ example: '+84901234567', description: 'Emergency vet phone' })
  emergency_vet_phone?: string;
}

export class UpdatePetDto {
  @ApiPropertyOptional({ example: 'Bông', description: 'Pet name', minLength: 1, maxLength: 100 })
  name?: string;

  @ApiPropertyOptional({ example: 'dog', description: 'Species', enum: ['dog', 'cat', 'other'] })
  species?: 'dog' | 'cat' | 'other';

  @ApiPropertyOptional({ example: 'Poodle', description: 'Breed', maxLength: 100 })
  breed?: string;

  @ApiPropertyOptional({ example: 'male', description: 'Gender', enum: ['male', 'female', 'unknown'] })
  gender?: 'male' | 'female' | 'unknown';

  @ApiPropertyOptional({ example: '2022-06-15', description: 'Date of birth' })
  date_of_birth?: string;

  @ApiPropertyOptional({ example: 5.5, description: 'Weight in kg', minimum: 0, maximum: 200 })
  weight_kg?: number;

  @ApiPropertyOptional({ example: 'Brown', description: 'Color', maxLength: 50 })
  color?: string;

  @ApiPropertyOptional({ example: ['https://example.com/photo1.jpg'], description: 'Pet photos (1-10)', type: [String], minItems: 1, maxItems: 10 })
  photos?: string[];

  @ApiPropertyOptional({ example: [], description: 'Vaccination records', type: [VaccinationRecordDto] })
  vaccination_records?: VaccinationRecordDto[];

  @ApiPropertyOptional({ example: [], description: 'Allergies', type: [String] })
  allergies?: string[];

  @ApiPropertyOptional({ example: [], description: 'Chronic conditions', type: [String] })
  chronic_conditions?: string[];

  @ApiPropertyOptional({ example: [], description: 'Current medications', type: [MedicationDto] })
  current_medications?: MedicationDto[];

  @ApiPropertyOptional({ example: 'unknown', description: 'Neutered status', enum: ['yes', 'no', 'unknown'] })
  is_neutered?: 'yes' | 'no' | 'unknown';

  @ApiPropertyOptional({ example: 'normal', description: 'Temperament', enum: ['friendly', 'shy', 'aggressive', 'normal'] })
  temperament?: 'friendly' | 'shy' | 'aggressive' | 'normal';

  @ApiPropertyOptional({ example: 'depends', description: 'Sociable with other animals', enum: ['yes', 'no', 'depends'] })
  sociable_with_others?: 'yes' | 'no' | 'depends';

  @ApiPropertyOptional({ example: 'Needs insulin injection twice daily', description: 'Special needs notes', maxLength: 1000 })
  special_needs_notes?: string;

  @ApiPropertyOptional({ example: 'Dr. Trần', description: 'Emergency vet name', maxLength: 200 })
  emergency_vet_name?: string;

  @ApiPropertyOptional({ example: '+84901234567', description: 'Emergency vet phone' })
  emergency_vet_phone?: string;
}
