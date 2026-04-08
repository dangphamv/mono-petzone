import { ApiProperty } from '@nestjs/swagger';

const BUCKET_ENUM = ['avatars', 'pet-photos', 'provider-photos', 'check-in-photos', 'chat-media', 'review-photos'] as const;

export class PresignedUrlDto {
  @ApiProperty({ enum: BUCKET_ENUM, example: 'pet-photos', description: 'Storage bucket name' })
  bucket: (typeof BUCKET_ENUM)[number];

  @ApiProperty({ example: 'photo_001.jpg', description: 'File name' })
  filename: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME content type' })
  content_type: string;
}

export class UploadImageDto {
  @ApiProperty({ enum: BUCKET_ENUM, example: 'pet-photos', description: 'Storage bucket name' })
  bucket: (typeof BUCKET_ENUM)[number];

  @ApiProperty({ example: '/9j/4AAQSkZJRgABAQ...', description: 'Base64-encoded image data' })
  base64: string;

  @ApiProperty({ example: 'photo_001.jpg', description: 'File name' })
  filename: string;
}
