import { ApiProperty } from '@nestjs/swagger';

export class InitiateCallDto {
  @ApiProperty({ enum: ['voice', 'video'], example: 'voice', description: 'Call type' })
  type: 'voice' | 'video';
}

export class EndCallDto {
  @ApiProperty({ example: 120, description: 'Call duration in seconds', minimum: 0 })
  duration_seconds: number;
}
