import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadCheckInPhotosDto {
  @ApiProperty({ example: ['https://storage.example.com/photo1.jpg', 'https://storage.example.com/photo2.jpg'], description: 'Array of photo URLs' })
  photos: string[];

  @ApiProperty({ enum: ['owner_to_store', 'store_to_owner'], example: 'owner_to_store', description: 'Handoff point direction' })
  handoff_point: 'owner_to_store' | 'store_to_owner';

  @ApiPropertyOptional({ example: 10.8231, description: 'Latitude of check-in location' })
  latitude?: number;

  @ApiPropertyOptional({ example: 106.6297, description: 'Longitude of check-in location' })
  longitude?: number;

  @ApiPropertyOptional({ example: 'Pet looks healthy and happy', description: 'Additional notes' })
  notes?: string;
}
