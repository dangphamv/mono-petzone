import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
  selectRoleSchema,
  forgotPasswordSchema,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, LoginDto, GoogleAuthDto, RefreshTokenDto, SelectRoleDto, ForgotPasswordDto } from './dto';
import {
  ok,
  EXAMPLE_OTP_SENT,
  EXAMPLE_AUTH_SESSION_NEW,
  EXAMPLE_AUTH_SESSION_EXISTING,
  EXAMPLE_REFRESH,
  EXAMPLE_USER,
  EXAMPLE_LOGOUT,
  ERROR_400,
  ERROR_401,
  ERROR_409,
  ERROR_429,
} from '../../common/swagger/examples';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Send OTP to phone number for registration or login' })
  @ApiResponse({ status: 201, description: 'OTP sent successfully', schema: { example: ok(EXAMPLE_OTP_SENT, 'OTP sent successfully') } })
  @ApiResponse({ status: 400, description: 'Invalid phone number format', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 429, description: 'Too many OTP requests', schema: { example: ERROR_429 } })
  sendOtp(@Body(new ZodValidationPipe(sendOtpSchema)) body: SendOtpDto) {
    return this.authService.sendOtp(body);
  }

  @Post('verify-otp')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Verify OTP — creates account if new user, logs in if existing' })
  @ApiResponse({ status: 201, description: 'OTP verified, session returned', schema: { example: ok(EXAMPLE_AUTH_SESSION_NEW, 'OTP verified') } })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 429, description: 'Too many verification attempts', schema: { example: ERROR_429 } })
  verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) body: VerifyOtpDto) {
    return this.authService.verifyOtp(body);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 201, description: 'Login successful', schema: { example: ok(EXAMPLE_AUTH_SESSION_EXISTING, 'Login successful') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Invalid email or password', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 429, description: 'Too many login attempts', schema: { example: ERROR_429 } })
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('google')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Authenticate with Google OAuth' })
  @ApiResponse({ status: 201, description: 'Google auth successful', schema: { example: ok(EXAMPLE_AUTH_SESSION_NEW, 'Google auth successful') } })
  @ApiResponse({ status: 400, description: 'Invalid Google ID token', schema: { example: ERROR_400 } })
  google(@Body(new ZodValidationPipe(googleAuthSchema)) body: GoogleAuthDto) {
    return this.authService.google(body);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 201, description: 'Reset email sent (always returns success to prevent email enumeration)' })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 429, description: 'Too many requests', schema: { example: ERROR_429 } })
  forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 201, description: 'Token refreshed', schema: { example: ok(EXAMPLE_REFRESH, 'Token refreshed') } })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token', schema: { example: ERROR_401 } })
  refresh(@Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.refresh(body);
  }

  @Post('select-role')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Select user role — one-time, immutable (owner or provider)' })
  @ApiResponse({ status: 201, description: 'Role selected successfully', schema: { example: ok(EXAMPLE_USER, 'Role selected successfully') } })
  @ApiResponse({ status: 400, description: 'Invalid role value', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 409, description: 'Role already selected', schema: { example: ERROR_409 } })
  selectRole(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(selectRoleSchema)) body: SelectRoleDto) {
    return this.authService.selectRole(user.id, body);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and invalidate session' })
  @ApiResponse({ status: 201, description: 'Logged out successfully', schema: { example: ok(EXAMPLE_LOGOUT, 'Logged out successfully') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }
}
