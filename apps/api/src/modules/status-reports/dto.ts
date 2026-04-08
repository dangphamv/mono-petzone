import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStatusReportDto {
  @ApiProperty({ example: 'Pet ate well today and played with other dogs in the yard.', description: 'Report content' })
  content: string;

  @ApiProperty({ example: ['https://storage.example.com/report1.jpg'], description: 'Array of photo URLs' })
  photos: string[];

  @ApiPropertyOptional({ enum: ['happy', 'normal', 'anxious', 'sick'], example: 'happy', description: 'Pet mood' })
  mood?: 'happy' | 'normal' | 'anxious' | 'sick';

  @ApiPropertyOptional({ enum: ['good', 'normal', 'poor'], example: 'good', description: 'Pet appetite level' })
  appetite?: 'good' | 'normal' | 'poor';

  @ApiPropertyOptional({ enum: ['active', 'normal', 'low'], example: 'active', description: 'Pet activity level' })
  activity_level?: 'active' | 'normal' | 'low';
}
