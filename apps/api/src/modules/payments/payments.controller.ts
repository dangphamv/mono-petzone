import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created, redirect URL returned' })
  create(@Body() body: any) {
    return this.paymentsService.create(body);
  }

  @Get('callback')
  @Public()
  @ApiOperation({ summary: 'Payment gateway webhook callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  callback() {
    return this.paymentsService.callback();
  }

  @Get(':orderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiResponse({ status: 200, description: 'Payment details returned' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Post(':orderId/refund')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request a refund for an order' })
  @ApiResponse({ status: 201, description: 'Refund initiated' })
  refund(@Param('orderId') orderId: string, @Body() body: any) {
    return this.paymentsService.refund(orderId, body);
  }

  @Get('payouts')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List provider payouts' })
  @ApiResponse({ status: 200, description: 'Payouts list returned' })
  getPayouts() {
    return this.paymentsService.getPayouts();
  }

  @Post('payouts/request')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request a payout' })
  @ApiResponse({ status: 201, description: 'Payout request submitted' })
  requestPayout(@Body() body: any) {
    return this.paymentsService.requestPayout(body);
  }
}
