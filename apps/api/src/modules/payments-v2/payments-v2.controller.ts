import { Controller, Post, Get, Param, Body, Req, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { initiatePaymentV2Schema, refundV2Schema } from '@petzone/validators';
import type { AuthUser } from '../../common/interfaces/auth-user';
import { PaymentsV2Service } from './payments-v2.service';
import { InitiatePaymentV2Dto, RefundV2Dto } from './dto';
import { ok, ERROR_400, ERROR_401, ERROR_403, ERROR_404 } from '../../common/swagger/examples';

@ApiTags('Payments v2')
@Controller('v2/payments')
export class PaymentsV2Controller {
  constructor(private readonly service: PaymentsV2Service) {}

  @Post('initiate')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Initiate v2 payment — PSP holds funds until split' })
  @ApiResponse({ status: 201, description: 'Payment URL returned', schema: { example: ok({ payment_url: 'https://sand-payment.9pay.vn/...' }) } })
  @ApiResponse({ status: 400, description: 'Order not v2 or not payable', schema: { example: ERROR_400 } })
  @ApiResponse({ status: 401, schema: { example: ERROR_401 } })
  @ApiResponse({ status: 403, schema: { example: ERROR_403 } })
  @ApiResponse({ status: 404, schema: { example: ERROR_404 } })
  initiate(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(initiatePaymentV2Schema)) body: InitiatePaymentV2Dto,
  ) {
    return this.service.initiate(user.id, body);
  }

  @Post('webhooks/9pay/collection')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: '9Pay collection webhook (IPN)' })
  async collectionWebhook(@Req() req: Request) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    return this.service.handleWebhook('collection', raw, req.headers as Record<string, string>);
  }

  @Post('webhooks/9pay/disbursement')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: '9Pay disbursement webhook (IPN)' })
  async disbursementWebhook(@Req() req: Request) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    return this.service.handleWebhook('disbursement', raw, req.headers as Record<string, string>);
  }

  @Post('webhooks/9pay/refund')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: '9Pay refund webhook (IPN)' })
  async refundWebhook(@Req() req: Request) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    return this.service.handleWebhook('refund', raw, req.headers as Record<string, string>);
  }

  @Post(':orderId/refund')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request refund for a v2 payment' })
  refund(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(refundV2Schema)) body: RefundV2Dto,
  ) {
    return this.service.refund(user.id, orderId, body);
  }

  @Get(':orderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get v2 payment for an order' })
  findByOrder(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.service.findByOrder(user.id, orderId);
  }
}
