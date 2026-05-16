import { Controller, Get, Post, Param, Body, Query, Headers } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Payment gateway webhook (IPN) callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed', schema: { example: ok(EXAMPLE_PAYMENT_CALLBACK, 'Webhook processed') } })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature', schema: { example: ERROR_400 } })
  callback(
    @Param('gateway') gateway: string,
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.paymentsService.processWebhook(gateway, body ?? {}, headers ?? {});
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

  @Post(':paymentId/confirm-cash')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Provider confirms cash received from owner',
    description:
      'For payment.method = "cash". Provider taps this at (or shortly after) check-in once owner hands over the agreed amount. Flips payment.status to completed and notifies the owner.',
  })
  @ApiResponse({ status: 201, description: 'Cash confirmed' })
  @ApiResponse({ status: 400, description: 'Not a cash payment / already completed', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 403, description: 'Not the order provider', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Payment not found', schema: { example: ERROR_404 } })
  confirmCash(@CurrentUser() user: AuthUser, @Param('paymentId') paymentId: string) {
    return this.paymentsService.confirmCashReceived(user.id, paymentId);
  }

  @Post(':paymentId/cancel')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Owner cancels a pending payment',
    description:
      'Allow the owner to abandon a pending MoMo redirect / VietQR QR they decided not to use. The order stays in pending_payment so they can pick a different method and retry. Only works while payment.status = "pending".',
  })
  @ApiResponse({ status: 201, description: 'Payment cancelled' })
  @ApiResponse({ status: 400, description: 'Payment not pending or race lost to completion', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 403, description: 'Not the order owner', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Payment not found', schema: { example: ERROR_404 } })
  cancelPending(@CurrentUser() user: AuthUser, @Param('paymentId') paymentId: string) {
    return this.paymentsService.cancelPending(user.id, paymentId);
  }

  @Post(':paymentId/dev-simulate-paid')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'DEV ONLY — simulate a successful VietQR webhook',
    description:
      'Only enabled when DEV_SIMULATE_ENABLED=true (default off). Lets the mobile team test the full pay-and-poll flow without using SePay dashboard. Caller must own the order; payment must be method=vietqr and status=pending. Returns 403 in production.',
  })
  @ApiResponse({ status: 201, description: 'Simulated payment success' })
  @ApiResponse({ status: 400, description: 'Payment not in simulatable state', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 403, description: 'Dev simulate disabled or not order owner', schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, description: 'Payment not found', schema: { example: ERROR_404 } })
  devSimulatePaid(@CurrentUser() user: AuthUser, @Param('paymentId') paymentId: string) {
    return this.paymentsService.devSimulateVietQRPaid(user.id, paymentId);
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
