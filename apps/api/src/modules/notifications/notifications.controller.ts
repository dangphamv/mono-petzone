import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiResponse({ status: 200, description: 'Notifications returned' })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllRead() {
    return this.notificationsService.markAllRead();
  }

  @Post('device-token')
  @ApiOperation({ summary: 'Register a device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  registerDeviceToken(@Body() body: any) {
    return this.notificationsService.registerDeviceToken(body);
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Remove a device token' })
  @ApiResponse({ status: 200, description: 'Device token removed' })
  removeDeviceToken(@Param('token') token: string) {
    return this.notificationsService.removeDeviceToken(token);
  }
}
