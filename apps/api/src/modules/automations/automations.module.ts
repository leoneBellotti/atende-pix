import { Module } from '@nestjs/common';
import { AutomationJobsController, AutomationsController } from './automations.controller';
import { AutomationsQueue } from './automations.queue';
import { AutomationsService } from './automations.service';
import { AutomationsWorker } from './automations.worker';

@Module({
  controllers: [AutomationJobsController, AutomationsController],
  providers: [AutomationsQueue, AutomationsService, AutomationsWorker]
})
export class AutomationsModule {}
