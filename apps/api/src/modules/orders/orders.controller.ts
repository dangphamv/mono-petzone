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
  checkInOrderSchema,
} from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CalculatePriceDto, CancelOrderDto, DeclineOrderDto, CheckOutOrderDto, CheckInOrderDto, UpdateOrderStatusDto } from './dto';
import {
  ok,
  okPaginated,
  EXAMPLE_PRICE_BREAKDOWN,
  EXAMPLE_ORDER,
  EXAMPLE_ORDER_LIST_ITEM,
  EXAMPLE_ORDER_HISTORY_ITEM,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('calculate-price')
  @ApiOperation({ summary: 'Calculate price breakdown for a booking' })
  @ApiResponse({ status: 201, description: 'Price breakdown returned', schema: { example: ok(EXAMPLE_PRICE_BREAKDOWN, 'Price breakdown returned') } })
  @ApiResponse({ status: 400, description: 'Validation error', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Room type not found', schema: { example: ERROR_404 } })
  calculatePrice(@Body(new ZodValidationPipe(calculatePriceSchema)) body: CalculatePriceDto) {
    return this.ordersService.calculatePrice(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking order' })
  @ApiResponse({ status: 201, description: 'Order created successfully', schema: { example: ok(EXAMPLE_ORDER, 'Order created successfully') } })
  @ApiResponse({ status: 400, description: 'Validation error or unavailable dates', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Provider or room not found', schema: { example: ERROR_404 } })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderDto) {
    return this.ordersService.create(user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List orders for current user' })
  @ApiResponse({ status: 200, description: 'Orders list returned', schema: { example: okPaginated([EXAMPLE_ORDER_LIST_ITEM], 'Orders list returned', 15) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
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
  @ApiResponse({ status: 200, description: 'Order details returned', schema: { example: ok(EXAMPLE_ORDER) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.id, id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Provider accepts an order' })
  @ApiResponse({ status: 201, description: 'Order accepted', schema: { example: ok({ ...EXAMPLE_ORDER, status: 'pending_payment' }, 'Order accepted') } })
  @ApiResponse({ status: 400, description: 'Order not in pending status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the provider can accept', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.accept(user.id, id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Provider declines an order' })
  @ApiResponse({ status: 201, description: 'Order declined, owner refunded 100%', schema: { example: ok({ ...EXAMPLE_ORDER, status: 'cancelled', cancelled_by: 'provider', cancellation_reason: 'Hết phòng cho dịp này', refund_amount: 1200000 }, 'Order declined') } })
  @ApiResponse({ status: 400, description: 'Order not in pending status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the provider can decline', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  decline(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(declineOrderSchema)) body: DeclineOrderDto) {
    return this.ordersService.decline(user.id, id, body);
  }

  @Post(':id/confirm-receive')
  @ApiOperation({ summary: 'Owner confirms pet receipt after check-out' })
  @ApiResponse({ status: 201, description: 'Order completed', schema: { example: ok({ ...EXAMPLE_ORDER, status: 'completed', completed_at: '2026-04-23T16:00:00.000Z' }, 'Order completed') } })
  @ApiResponse({ status: 400, description: 'Order not in check_out status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the owner can confirm receipt', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  confirmReceive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.confirmReceive(user.id, id);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Provider records pet condition at handoff and checks the order in' })
  @ApiResponse({ status: 201, description: 'Order checked in, handoff photos and note saved', schema: { example: ok({ ...EXAMPLE_ORDER, status: 'checked_in' }, 'Pet checked in') } })
  @ApiResponse({ status: 400, description: 'Order not in confirmed status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the provider can check in', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  checkIn(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(checkInOrderSchema)) body: CheckInOrderDto) {
    return this.ordersService.checkIn(user.id, id, body);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Provider uploads check-out photos' })
  @ApiResponse({ status: 201, description: 'Check-out recorded, awaiting owner confirmation', schema: { example: ok({ ...EXAMPLE_ORDER, status: 'check_out' }, 'Check-out recorded') } })
  @ApiResponse({ status: 400, description: 'Order not in in_progress status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Only the provider can check out', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  checkOut(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(checkOutOrderSchema)) body: CheckOutOrderDto) {
    return this.ordersService.checkOut(user.id, id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated', schema: { example: ok({ ...EXAMPLE_ORDER, status: 'in_progress' }, 'Order status updated') } })
  @ApiResponse({ status: 400, description: 'Invalid status transition', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not allowed to update this order', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(user.id, id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 201, description: 'Order cancelled successfully', schema: { example: ok({ ...EXAMPLE_ORDER, status: 'cancelled', cancelled_by: 'owner', cancellation_reason: 'Đổi kế hoạch du lịch', refund_amount: 600000, cancelled_at: '2026-04-12T10:00:00.000Z' }, 'Order cancelled successfully') } })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in current status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body(new ZodValidationPipe(cancelOrderSchema)) body: CancelOrderDto) {
    return this.ordersService.cancel(user.id, id, body);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Order history returned', schema: { example: ok([EXAMPLE_ORDER_HISTORY_ITEM]) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  getHistory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getHistory(user.id, id);
  }
}
