import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Order ID to review' })
  order_id: string;

  @ApiProperty({ example: 4, description: 'Overall rating (1-5)', minimum: 1, maximum: 5 })
  rating_overall: number;

  @ApiPropertyOptional({ example: 5, description: 'Cleanliness rating (1-5)', minimum: 1, maximum: 5 })
  rating_cleanliness?: number;

  @ApiPropertyOptional({ example: 4, description: 'Care quality rating (1-5)', minimum: 1, maximum: 5 })
  rating_care_quality?: number;

  @ApiPropertyOptional({ example: 3, description: 'Communication rating (1-5)', minimum: 1, maximum: 5 })
  rating_communication?: number;

  @ApiPropertyOptional({ example: 4, description: 'Value for money rating (1-5)', minimum: 1, maximum: 5 })
  rating_value?: number;

  @ApiPropertyOptional({ example: 'Great service, my pet was very happy!', description: 'Review text (max 1000 chars)' })
  text?: string;

  @ApiProperty({ example: ['https://storage.example.com/review1.jpg'], description: 'Photo URLs (max 5)', default: [] })
  photos: string[];
}

export class RespondReviewDto {
  @ApiProperty({ example: 'Thank you for your kind words! We loved having your pet.', description: 'Provider response (1-500 chars)' })
  response: string;
}
