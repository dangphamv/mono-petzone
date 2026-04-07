import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @Public()
  @ApiOperation({ summary: 'Send OTP to phone number or email' })
  @ApiResponse({ status: 201, description: 'OTP sent successfully' })
  sendOtp(@Body() body: any) {
    return this.authService.sendOtp(body);
  }

  @Post('verify-otp')
  @Public()
  @ApiOperation({ summary: 'Verify OTP and return session' })
  @ApiResponse({ status: 201, description: 'OTP verified, session returned' })
  verifyOtp(@Body() body: any) {
    return this.authService.verifyOtp(body);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 201, description: 'Login successful' })
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('google')
  @Public()
  @ApiOperation({ summary: 'Authenticate with Google OAuth' })
  @ApiResponse({ status: 201, description: 'Google auth successful' })
  google(@Body() body: any) {
    return this.authService.google(body);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 201, description: 'Token refreshed' })
  refresh(@Body() body: any) {
    return this.authService.refresh(body);
  }

  @Post('select-role')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Select user role (pet_owner or provider)' })
  @ApiResponse({ status: 201, description: 'Role selected successfully' })
  selectRole(@Body() body: any) {
    return this.authService.selectRole(body);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and invalidate session' })
  @ApiResponse({ status: 201, description: 'Logged out successfully' })
  logout() {
    return this.authService.logout();
  }
}
