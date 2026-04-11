import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStatusReportDto {
  @ApiProperty({ example: ['https://storage.example.com/report1.jpg'], description: 'Photo URLs (1-10)', type: [String] })
  photos: string[];

  @ApiPropertyOptional({ enum: ['normal', 'eating_less', 'not_eating'], example: 'normal', description: 'Feeding status' })
  feeding_status?: 'normal' | 'eating_less' | 'not_eating';

  @ApiPropertyOptional({ example: 'Pet ate well today and played with other dogs in the yard.', description: 'Activity summary (max 2000 chars)' })
  activity_summary?: string;

  @ApiPropertyOptional({ example: 'No concerns today.', description: 'Additional note (max 2000 chars)' })
  note?: string;
}

export class ReactStatusReportDto {
  @ApiProperty({ enum: ['heart', 'thumbs_up'], example: 'heart', description: 'Reaction type' })
  reaction: 'heart' | 'thumbs_up';
}

export class ReplyStatusReportDto {
  @ApiProperty({ example: 'Thank you for the update!', description: 'Reply text (1-500 chars)', minLength: 1, maxLength: 500 })
  text: string;
}
