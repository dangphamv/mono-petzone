import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { registerDeviceTokenSchema } from '@petzone/validators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto';
import {
  ok,
  okPaginated,
  EXAMPLE_NOTIFICATION,
  EXAMPLE_DEVICE_TOKEN,
  EXAMPLE_MARK_ALL_READ,
  ERROR_400,
  ERROR_401,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiResponse({ status: 200, description: 'Notifications returned', schema: { example: okPaginated([EXAMPLE_NOTIFICATION], 'Notifications returned', 47) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
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
  @ApiResponse({ status: 200, description: 'All notifications marked as read', schema: { example: ok(EXAMPLE_MARK_ALL_READ, 'All notifications marked as read') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', schema: { example: ok({ ...EXAMPLE_NOTIFICATION, is_read: true, read_at: '2026-04-12T10:00:00.000Z' }, 'Notification marked as read') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Notification not found', schema: { example: ERROR_404 } })
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('device-token')
  @ApiOperation({ summary: 'Register a device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered', schema: { example: ok(EXAMPLE_DEVICE_TOKEN, 'Device token registered') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  registerDeviceToken(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(registerDeviceTokenSchema)) body: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(user.id, body);
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Remove a device token' })
  @ApiResponse({ status: 200, description: 'Device token removed', schema: { example: ok({ token: EXAMPLE_DEVICE_TOKEN.token, removed: true }, 'Device token removed') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Device token not found', schema: { example: ERROR_404 } })
  removeDeviceToken(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.notificationsService.removeDeviceToken(user.id, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted', schema: { example: ok({ id: EXAMPLE_NOTIFICATION.id, deleted: true }, 'Notification deleted') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Notification not found', schema: { example: ERROR_404 } })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
