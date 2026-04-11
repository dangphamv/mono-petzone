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

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created, redirect URL returned' })
  @ApiResponse({ status: 400, description: 'Order not in payable status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createPaymentSchema)) body: CreatePaymentDto) {
    return this.paymentsService.create(user.id, body);
  }

  @Post('callback/:gateway')
  @Public()
  @ApiOperation({ summary: 'Payment gateway webhook callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  callback(@Param('gateway') gateway: string) {
    return this.paymentsService.callback(gateway);
  }

  @Get('payouts')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider payouts' })
  @ApiResponse({ status: 200, description: 'Payouts list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
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
  @ApiResponse({ status: 201, description: 'Payout request submitted' })
  @ApiResponse({ status: 400, description: 'No available balance for payout' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  requestPayout(@CurrentUser() user: AuthUser) {
    return this.paymentsService.requestPayout(user.id);
  }

  @Get(':orderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiResponse({ status: 200, description: 'Payment details returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findByOrder(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(user.id, orderId);
  }

  @Post(':orderId/refund')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request a refund for an order' })
  @ApiResponse({ status: 201, description: 'Refund initiated' })
  @ApiResponse({ status: 400, description: 'Order not eligible for refund' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  refund(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string, @Body(new ZodValidationPipe(refundSchema)) body: RefundDto) {
    return this.paymentsService.refund(user.id, orderId, body);
  }
}
