import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AdminActionLogService } from './_shared/admin-action-log.service';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminProvidersController } from './providers/admin-providers.controller';
import { AdminProvidersService } from './providers/admin-providers.service';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminOrdersService } from './orders/admin-orders.service';
import { AdminDisputesController } from './disputes/admin-disputes.controller';
import { AdminDisputesService } from './disputes/admin-disputes.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminPetsController } from './pets/admin-pets.controller';
import { AdminPetsService } from './pets/admin-pets.service';
import { AdminReviewsController } from './reviews/admin-reviews.controller';
import { AdminReviewsService } from './reviews/admin-reviews.service';
import { AdminConfigController } from './config/admin-config.controller';
import { AdminConfigService } from './config/admin-config.service';

@Module({
  imports: [OrdersModule],
  controllers: [
    AdminDashboardController,
    AdminProvidersController,
    AdminOrdersController,
    AdminDisputesController,
    AdminUsersController,
    AdminPetsController,
    AdminReviewsController,
    AdminConfigController,
  ],
  providers: [
    AdminActionLogService,
    AdminDashboardService,
    AdminProvidersService,
    AdminOrdersService,
    AdminDisputesService,
    AdminUsersService,
    AdminPetsService,
    AdminReviewsService,
    AdminConfigService,
  ],
})
export class AdminModule {}
