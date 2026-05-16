import { Injectable, BadRequestException } from '@nestjs/common';
import { MomoGateway } from './momo.gateway';
import { VietQRGateway } from './vietqr.gateway';
import type { GatewayName, PaymentGateway } from './gateway.interface';

/**
 * Resolve a gateway adapter by `payments.method`. Only methods with an adapter
 * are routed — `bank_transfer` returns undefined and is handled manually.
 */
@Injectable()
export class GatewayRegistry {
  private readonly gateways: Map<GatewayName, PaymentGateway>;

  constructor(
    private readonly momo: MomoGateway,
    private readonly vietqr: VietQRGateway,
  ) {
    this.gateways = new Map<GatewayName, PaymentGateway>([
      ['momo', momo],
      ['vietqr', vietqr],
    ]);
  }

  get(method: string): PaymentGateway | undefined {
    return this.gateways.get(method as GatewayName);
  }

  require(method: string): PaymentGateway {
    const gw = this.get(method);
    if (!gw) throw new BadRequestException(`Payment method '${method}' has no gateway adapter`);
    return gw;
  }
}
