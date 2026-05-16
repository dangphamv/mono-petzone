import { Global, Module } from '@nestjs/common';
import { FcmService } from './fcm.service';

/**
 * Global so any module can inject FcmService without explicit import.
 * Mirror Supabase/Cache wiring used elsewhere in the app.
 */
@Global()
@Module({
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
