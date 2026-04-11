import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { registerDeviceTokenSchema } from '@petzone/validators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiResponse({ status: 200, description: 'Notifications returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(user.id, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('device-token')
  @ApiOperation({ summary: 'Register a device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  registerDeviceToken(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(registerDeviceTokenSchema)) body: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(user.id, body);
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Remove a device token' })
  @ApiResponse({ status: 200, description: 'Device token removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device token not found' })
  removeDeviceToken(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.notificationsService.removeDeviceToken(user.id, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
