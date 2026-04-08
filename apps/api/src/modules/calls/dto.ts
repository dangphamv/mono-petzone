import { ApiProperty } from '@nestjs/swagger';

export class InitiateCallDto {
  @ApiProperty({ enum: ['voice', 'video'], example: 'voice', description: 'Call type' })
  type: 'voice' | 'video';
}
