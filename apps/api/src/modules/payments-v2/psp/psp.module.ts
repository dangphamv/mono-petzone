import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_PROVIDER } from './psp.interface';
import { NinepayProvider } from './ninepay.provider';
import { MockProvider } from './mock.provider';

@Module({
  providers: [
    NinepayProvider,
    MockProvider,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (config: ConfigService, ninepay: NinepayProvider, mock: MockProvider) => {
        const enabled = config.get<string>('NINEPAY_ENABLED') === 'true';
        return enabled ? ninepay : mock;
      },
      inject: [ConfigService, NinepayProvider, MockProvider],
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PspModule {}
