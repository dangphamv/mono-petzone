import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PAGINATION } from '@petzone/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../../common/interfaces/auth-user';
import { AdminPaymentsService } from './admin-payments.service';
import {
  recordManualRefundSchema,
  matchBankTransactionSchema,
  type RecordManualRefundInput,
  type MatchBankTransactionInput,
} from '@petzone/validators';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly service: AdminPaymentsService) {}

  @Post(':id/record-manual-refund')
  @ApiOperation({
    summary: 'Admin records a refund already sent out-of-band',
    description:
      'For VietQR (and other manual flows) where the gateway has no refund API — admin transferred funds to owner separately and records it here for audit. Updates payments.refund_amount + creates a refunds row marked completed.',
  })
  @ApiResponse({ status: 201, description: 'Refund recorded' })
  @ApiResponse({ status: 400, description: 'Amount exceeds remaining refundable / wrong status' })
  recordManualRefund(
    @CurrentUser() user: AuthUser,
    @Param('id') paymentId: string,
    @Body(new ZodValidationPipe(recordManualRefundSchema)) body: RecordManualRefundInput,
  ) {
    return this.service.recordManualRefund(user.id, paymentId, body);
  }

  @Get('bank-transactions/unmatched')
  @ApiOperation({
    summary: 'List bank transactions not yet matched to a payment',
    description:
      'For reconciliation UI — shows incoming SePay transfers that the auto-matcher could not link to a pending VietQR payment.',
  })
  @ApiResponse({ status: 200, description: 'Paginated unmatched bank transactions' })
  listUnmatched(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.listUnmatched({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }

  @Post('bank-transactions/:bankTxId/match')
  @ApiOperation({
    summary: 'Manually link a bank transaction to a pending VietQR payment',
    description:
      'For when owner ghi sai memo but the order is identifiable. Runs the same state machine as the auto-match.',
  })
  @ApiResponse({ status: 201, description: 'Matched' })
  matchManually(
    @CurrentUser() user: AuthUser,
    @Param('bankTxId') bankTxId: string,
    @Body(new ZodValidationPipe(matchBankTransactionSchema)) body: MatchBankTransactionInput,
  ) {
    return this.service.matchManually(user.id, bankTxId, body);
  }
}
