import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Reflector } from '@nestjs/core';

import { SupabaseModule } from './modules/supabase/supabase.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { SearchModule } from './modules/search/search.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PaymentsV2Module } from './modules/payments-v2/payments-v2.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { StatusReportsModule } from './modules/status-reports/status-reports.module';
import { ChatModule } from './modules/chat/chat.module';
import { CallsModule } from './modules/calls/calls.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FcmModule } from './modules/fcm/fcm.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';
import { MailModule } from './modules/mail/mail.module';

import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SupabaseService } from './modules/supabase/supabase.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: 300_000 }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    SupabaseModule,
    FcmModule,
    MailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PetsModule,
    ProvidersModule,
    SearchModule,
    OrdersModule,
    PaymentsModule,
    PaymentsV2Module,
    CheckInModule,
    StatusReportsModule,
    ChatModule,
    CallsModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    UploadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_GUARD,
      useFactory: (
        reflector: Reflector,
        supabase: SupabaseService,
        config: ConfigService,
      ) => new SupabaseAuthGuard(reflector, supabase, config),
      inject: [Reflector, SupabaseService, ConfigService],
    },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
