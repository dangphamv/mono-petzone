import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
} from '@petzone/validators';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CancelOrderDto, UpdateOrderStatusDto } from './dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or unavailable dates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Provider or room not found' })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderInput) {
    return this.ordersService.create(user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List orders for current user' })
  @ApiResponse({ status: 200, description: 'Orders list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll(user.id, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not allowed to update this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusInput) {
    return this.ordersService.updateStatus(user.id, id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 201, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(cancelOrderSchema)) body: CancelOrderInput) {
    return this.ordersService.cancel(user.id, id, body);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Order history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getHistory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getHistory(user.id, id);
  }
}
