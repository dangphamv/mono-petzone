import { Module } from '@nestjs/common';
import { StatusReportsController } from './status-reports.controller';
import { StatusReportsService } from './status-reports.service';

@Module({
  controllers: [StatusReportsController],
  providers: [StatusReportsService],
  exports: [StatusReportsService],
})
export class StatusReportsModule {}
