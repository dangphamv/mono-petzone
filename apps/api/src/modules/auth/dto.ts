import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+84901234567', description: 'Phone number', pattern: '^(\\+84|0)\\d{9,10}$' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+84901234567', description: 'Phone number' })
  phone: string;

  @ApiProperty({ example: '123456', description: 'OTP code (6 digits)', minLength: 6, maxLength: 6 })
  otp: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address', format: 'email' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password', minLength: 8 })
  password: string;
}

export class GoogleAuthDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIs...', description: 'Google ID token' })
  id_token: string;

  @ApiPropertyOptional({ example: 'random-nonce-string', description: 'Nonce for replay protection' })
  nonce?: string;
}

export class SelectRoleDto {
  @ApiProperty({ example: 'owner', description: 'User role (one-time selection)', enum: ['owner', 'provider'] })
  role: 'owner' | 'provider';
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token' })
  refresh_token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Account email', format: 'email' })
  email: string;

  @ApiPropertyOptional({ example: 'https://admin.petzone.vn/reset-password', description: 'URL the recovery link redirects to' })
  redirect_to?: string;
}
