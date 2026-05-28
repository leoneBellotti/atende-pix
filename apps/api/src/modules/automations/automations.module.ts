import { Module } from '@nestjs/common';
import { AutomationJobsController, AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';

@Module({
  controllers: [AutomationJobsController, AutomationsController],
  providers: [AutomationsService]
})
export class AutomationsModule {}
