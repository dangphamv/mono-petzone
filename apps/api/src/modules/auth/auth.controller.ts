import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, LoginDto, RegisterDto, GoogleAuthDto, RefreshTokenDto, SelectRoleDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send OTP to phone number or email' })
  @ApiResponse({ status: 201, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  sendOtp(@CurrentUser() user: any, @Body() body: SendOtpDto) {
    return this.authService.sendOtp(user.id, body);
  }

  @Post('verify-otp')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify OTP and return session' })
  @ApiResponse({ status: 201, description: 'OTP verified, session returned' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many verification attempts' })
  verifyOtp(@CurrentUser() user: any, @Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(user.id, body);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email or phone already registered' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('google')
  @Public()
  @ApiOperation({ summary: 'Authenticate with Google OAuth' })
  @ApiResponse({ status: 201, description: 'Google auth successful' })
  @ApiResponse({ status: 400, description: 'Invalid Google ID token' })
  google(@Body() body: GoogleAuthDto) {
    return this.authService.google(body);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 201, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body);
  }

  @Post('select-role')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Select user role (pet_owner or provider)' })
  @ApiResponse({ status: 201, description: 'Role selected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Role already selected' })
  selectRole(@CurrentUser() user: any, @Body() body: SelectRoleDto) {
    return this.authService.selectRole(user.id, body);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and invalidate session' })
  @ApiResponse({ status: 201, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }
}
