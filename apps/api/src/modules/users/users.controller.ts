import { Controller, Get, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
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
import {
  ok,
  EXAMPLE_USER,
  EXAMPLE_USER_PUBLIC,
  EXAMPLE_NOTIFICATION_PREFERENCES,
  ERROR_400,
  ERROR_401,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile returned', schema: { example: ok(EXAMPLE_USER) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', schema: { example: ok(EXAMPLE_USER, 'Profile updated successfully') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  updateMe(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto) {
    return this.usersService.updateMe(user.id, body);
  }

  @Get('me/notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences returned', schema: { example: ok(EXAMPLE_NOTIFICATION_PREFERENCES) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  getNotificationPreferences(@CurrentUser() user: AuthUser) {
    return this.usersService.getNotificationPreferences(user.id);
  }

  @Patch('me/notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated', schema: { example: ok(EXAMPLE_NOTIFICATION_PREFERENCES, 'Notification preferences updated') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  updateNotificationPreferences(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(notificationPreferencesSchema)) body: NotificationPreferencesDto) {
    return this.usersService.updateNotificationPreferences(user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User profile returned', schema: { example: ok(EXAMPLE_USER_PUBLIC) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'User not found', schema: { example: ERROR_404 } })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }
}
