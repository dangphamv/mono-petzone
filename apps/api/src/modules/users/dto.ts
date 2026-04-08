import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Full name', minLength: 2, maxLength: 100 })
  full_name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL', format: 'url' })
  avatar_url?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address', format: 'email' })
  email?: string;
}

export class NotificationPreferencesDto {
  @ApiPropertyOptional({ example: true, description: 'Order status notifications' })
  order_status?: boolean;

  @ApiPropertyOptional({ example: true, description: 'New message notifications' })
  new_message?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Status report notifications' })
  status_report?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Review notifications' })
  review?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Promotion notifications' })
  promotion?: boolean;
}
