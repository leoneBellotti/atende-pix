import { Module } from '@nestjs/common';
import { AutomationJobsController, AutomationsController } from './automations.controller';
import { AutomationsQueue } from './automations.queue';
import { AutomationsService } from './automations.service';

@Module({
  controllers: [AutomationJobsController, AutomationsController],
  providers: [AutomationsQueue, AutomationsService]
})
export class AutomationsModule {}
