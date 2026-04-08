import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiPropertyOptional({ example: 'Hello, how is my pet doing?', description: 'Message content (max 2000 chars)' })
  content?: string;

  @ApiProperty({ enum: ['text', 'image'], example: 'text', description: 'Message type', default: 'text' })
  type: 'text' | 'image';

  @ApiPropertyOptional({ example: 'https://storage.example.com/chat/image1.jpg', description: 'Image URL (required when type is image)' })
  image_url?: string;
}
