import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', description: 'Provider record id (providers.id). Caller is treated as owner.' })
  provider_id?: string;

  @ApiPropertyOptional({ example: '11111111-1111-4111-8111-111111111111', description: 'Owner user id (users.id). Caller must be a provider; their provider record is resolved from auth.' })
  owner_id?: string;

  @ApiPropertyOptional({ example: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', description: 'Order id to attach the conversation to. Either party of the order can call.' })
  order_id?: string;
}

export class SendMessageDto {
  @ApiPropertyOptional({ example: 'Hello, how is my pet doing?', description: 'Message content (max 2000 chars)' })
  content?: string;

  @ApiProperty({ enum: ['text', 'image'], example: 'text', description: 'Message type', default: 'text' })
  type: 'text' | 'image';

  @ApiPropertyOptional({ example: 'https://storage.example.com/chat/image1.jpg', description: 'Image URL (required when type is image)' })
  image_url?: string;
}
