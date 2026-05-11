import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import {
  adminMessageSchema,
  adminCreateOrderSchema,
  cancelOrderSchema,
} from '@petzone/validators';
import type { CancelOrderInput } from '@petzone/validators';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminOrdersService } from './admin-orders.service';
import { AdminMessageDto, AdminCreateOrderDto } from '../dto';
import {
  ok,
  okPaginated,
  EXAMPLE_ORDER_LIST_ITEM,
  EXAMPLE_EXPORT_ORDERS,
  EXAMPLE_ADMIN_MESSAGE_RESULT,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../../common/swagger/examples';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ status: 200, description: 'Orders list returned', schema: { example: okPaginated([EXAMPLE_ORDER_LIST_ITEM], 'Orders list returned', 2017) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  getOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getOrders({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      search,
      status,
    });
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a booking order on behalf of an owner' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Owner / provider / room not found', schema: { example: ERROR_404 } })
  createOrder(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(adminCreateOrderSchema)) body: AdminCreateOrderDto) {
    return this.service.createOrder(user.id, body);
  }

  @Patch('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel an order (admin override)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Validation error or order not cancellable', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  cancelOrder(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(cancelOrderSchema)) body: CancelOrderInput) {
    return this.service.cancelOrder(user.id, id, body.reason);
  }

  @Get('orders/export')
  @ApiOperation({ summary: 'Export orders as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file returned', schema: { example: ok(EXAMPLE_EXPORT_ORDERS, 'Export ready') } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  exportOrders() {
    return this.service.exportOrders();
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail with room, pets, and add-ons' })
  @ApiResponse({ status: 200, description: 'Order detail returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  getOrderDetail(@Param('id') id: string) {
    return this.service.getOrderDetail(id);
  }

  @Post('orders/:id/message')
  @ApiOperation({ summary: 'Send mediation message to both parties' })
  @ApiResponse({ status: 201, description: 'Message sent to both parties', schema: { example: ok(EXAMPLE_ADMIN_MESSAGE_RESULT, 'Message sent to both parties') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Admin role required', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  sendMessage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(adminMessageSchema)) body: AdminMessageDto) {
    return this.service.sendMessage(user.id, id, body);
  }
}
