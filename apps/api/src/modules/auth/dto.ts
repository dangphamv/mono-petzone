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

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address', format: 'email' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password', minLength: 8 })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Full name', minLength: 2, maxLength: 100 })
  full_name: string;

  @ApiPropertyOptional({ example: '+84901234567', description: 'Phone number', pattern: '^(\\+84|0)\\d{9,10}$' })
  phone?: string;
}

export class GoogleAuthDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIs...', description: 'Google ID token' })
  id_token: string;

  @ApiPropertyOptional({ example: 'random-nonce-string', description: 'Nonce for replay protection' })
  nonce?: string;
}

export class SelectRoleDto {
  @ApiProperty({ example: 'owner', description: 'User role', enum: ['owner', 'provider', 'admin'] })
  role: 'owner' | 'provider' | 'admin';
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token' })
  refresh_token: string;
}
