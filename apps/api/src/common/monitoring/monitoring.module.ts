import { Module } from '@nestjs/common';
import { ErrorMonitoringService } from './error-monitoring.service';

@Module({
  providers: [ErrorMonitoringService],
  exports: [ErrorMonitoringService]
})
export class MonitoringModule {}
