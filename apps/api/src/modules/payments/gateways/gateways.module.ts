import { Module } from '@nestjs/common';
import { MomoGateway } from './momo.gateway';
import { VietQRGateway } from './vietqr.gateway';
import { GatewayRegistry } from './gateway.registry';

@Module({
  providers: [MomoGateway, VietQRGateway, GatewayRegistry],
  exports: [GatewayRegistry],
})
export class GatewaysModule {}
