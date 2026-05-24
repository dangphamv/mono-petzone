import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchProvidersDto {
  @ApiProperty({ example: 10.7769, description: 'Search center latitude' })
  latitude: number;

  @ApiProperty({ example: 106.7009, description: 'Search center longitude' })
  longitude: number;

  @ApiProperty({ example: 10, description: 'Search radius in km (max 50)', default: 10, maximum: 50 })
  radius_km: number;

  @ApiPropertyOptional({ example: '2026-04-15', description: 'Check-in date (YYYY-MM-DD)' })
  check_in_date?: string;

  @ApiPropertyOptional({ example: '2026-04-18', description: 'Check-out date (YYYY-MM-DD)' })
  check_out_date?: string;

  @ApiPropertyOptional({ example: 'dog', description: 'Filter by pet species', enum: ['dog', 'cat', 'other'] })
  species?: 'dog' | 'cat' | 'other';

  @ApiPropertyOptional({ example: 'Happy Paws', description: 'Filter by business name (case-insensitive partial match)' })
  keyword?: string;

  @ApiPropertyOptional({ example: 100000, description: 'Minimum price per night in VND' })
  min_price?: number;

  @ApiPropertyOptional({ example: 500000, description: 'Maximum price per night in VND' })
  max_price?: number;

  @ApiPropertyOptional({ example: 4, description: 'Minimum rating (1-5)', minimum: 1, maximum: 5 })
  min_rating?: number;

  @ApiProperty({ example: 'distance', description: 'Sort order', enum: ['distance', 'price_asc', 'price_desc', 'rating'], default: 'distance' })
  sort_by: 'distance' | 'price_asc' | 'price_desc' | 'rating';

  @ApiProperty({ example: 1, description: 'Page number', default: 1 })
  page: number;

  @ApiProperty({ example: 20, description: 'Results per page', default: 20 })
  limit: number;
}

export class AddFavoriteDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Provider UUID' })
  provider_id: string;
}
