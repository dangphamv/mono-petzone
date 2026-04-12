import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createPaymentSchema, refundSchema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, RefundDto } from './dto';
import {
  ok,
  okPaginated,
  EXAMPLE_PAYMENT_CREATE,
  EXAMPLE_PAYMENT,
  EXAMPLE_PAYMENT_CALLBACK,
  EXAMPLE_REFUND,
  EXAMPLE_PAYOUT,
  EXAMPLE_PAYOUT_REQUEST,
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} from '../../common/swagger/examples';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created, redirect URL returned', schema: { example: ok(EXAMPLE_PAYMENT_CREATE, 'Payment created') } })
  @ApiResponse({ status: 400, description: 'Order not in payable status', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order not found', schema: { example: ERROR_404 } })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createPaymentSchema)) body: CreatePaymentDto) {
    return this.paymentsService.create(user.id, body);
  }

  @Post('callback/:gateway')
  @Public()
  @ApiOperation({ summary: 'Payment gateway webhook callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed', schema: { example: ok(EXAMPLE_PAYMENT_CALLBACK, 'Webhook processed') } })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature', schema: { example: ERROR_400 } })
  callback(@Param('gateway') gateway: string) {
    return this.paymentsService.callback(gateway);
  }

  @Get('payouts')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider payouts' })
  @ApiResponse({ status: 200, description: 'Payouts list returned', schema: { example: okPaginated([EXAMPLE_PAYOUT], 'Payouts list returned', 24) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  getPayouts(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getPayouts(user.id, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Post('payouts/request')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request a payout' })
  @ApiResponse({ status: 201, description: 'Payout request submitted', schema: { example: ok(EXAMPLE_PAYOUT_REQUEST, 'Payout request submitted') } })
  @ApiResponse({ status: 400, description: 'No available balance for payout', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, description: 'Not a provider', schema: { example: ERROR_403 } })
  requestPayout(@CurrentUser() user: AuthUser) {
    return this.paymentsService.requestPayout(user.id);
  }

  @Get(':orderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiResponse({ status: 200, description: 'Payment details returned', schema: { example: ok(EXAMPLE_PAYMENT) } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Payment not found', schema: { example: ERROR_404 } })
  findByOrder(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(user.id, orderId);
  }

  @Post(':orderId/refund')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request a refund for an order' })
  @ApiResponse({ status: 201, description: 'Refund initiated', schema: { example: ok(EXAMPLE_REFUND, 'Refund initiated') } })
  @ApiResponse({ status: 400, description: 'Order not eligible for refund', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: ERROR_401 } })
  @ApiResponse({ status: 404, description: 'Order or payment not found', schema: { example: ERROR_404 } })
  refund(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string, @Body(new ZodValidationPipe(refundSchema)) body: RefundDto) {
    return this.paymentsService.refund(user.id, orderId, body);
  }
}
