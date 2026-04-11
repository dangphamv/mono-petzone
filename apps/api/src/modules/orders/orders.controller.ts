import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createOrderSchema,
  calculatePriceSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  declineOrderSchema,
  checkOutOrderSchema,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CalculatePriceDto, CancelOrderDto, DeclineOrderDto, CheckOutOrderDto, UpdateOrderStatusDto } from './dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('calculate-price')
  @ApiOperation({ summary: 'Calculate price breakdown for a booking' })
  @ApiResponse({ status: 201, description: 'Price breakdown returned' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room type not found' })
  calculatePrice(@Body(new ZodValidationPipe(calculatePriceSchema)) body: CalculatePriceDto) {
    return this.ordersService.calculatePrice(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or unavailable dates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Provider or room not found' })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderDto) {
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

  @Post(':id/accept')
  @ApiOperation({ summary: 'Provider accepts an order' })
  @ApiResponse({ status: 201, description: 'Order accepted' })
  @ApiResponse({ status: 400, description: 'Order not in pending status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the provider can accept' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.accept(user.id, id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Provider declines an order' })
  @ApiResponse({ status: 201, description: 'Order declined, owner refunded 100%' })
  @ApiResponse({ status: 400, description: 'Order not in pending status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the provider can decline' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  decline(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(declineOrderSchema)) body: DeclineOrderDto) {
    return this.ordersService.decline(user.id, id, body);
  }

  @Post(':id/confirm-receive')
  @ApiOperation({ summary: 'Owner confirms pet receipt after check-out' })
  @ApiResponse({ status: 201, description: 'Order completed' })
  @ApiResponse({ status: 400, description: 'Order not in check_out status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the owner can confirm receipt' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  confirmReceive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.confirmReceive(user.id, id);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Provider uploads check-out photos' })
  @ApiResponse({ status: 201, description: 'Check-out recorded, awaiting owner confirmation' })
  @ApiResponse({ status: 400, description: 'Order not in in_progress status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the provider can check out' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  checkOut(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(checkOutOrderSchema)) body: CheckOutOrderDto) {
    return this.ordersService.checkOut(user.id, id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not allowed to update this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(user.id, id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 201, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(cancelOrderSchema)) body: CancelOrderDto) {
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
