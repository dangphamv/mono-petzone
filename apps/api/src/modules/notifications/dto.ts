import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', description: 'Device push token' })
  token: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'], example: 'ios', description: 'Device platform' })
  platform: 'ios' | 'android' | 'web';
}
