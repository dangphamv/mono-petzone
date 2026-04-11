import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';
import { UpdateProfileDto, NotificationPreferencesDto } from './dto';
import {
  updateProfileSchema,
  notificationPreferencesSchema,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateMe(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto) {
    return this.usersService.updateMe(user.id, body);
  }

  @Get('me/notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getNotificationPreferences(@CurrentUser() user: AuthUser) {
    return this.usersService.getNotificationPreferences(user.id);
  }

  @Patch('me/notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateNotificationPreferences(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(notificationPreferencesSchema)) body: NotificationPreferencesDto) {
    return this.usersService.updateNotificationPreferences(user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }
}
