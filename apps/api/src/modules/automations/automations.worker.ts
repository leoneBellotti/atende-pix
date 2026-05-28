import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { AUTOMATION_QUEUE_NAME } from './automations.queue';
import { AutomationsService } from './automations.service';

type AutomationJobData = {
  logId?: string;
};

@Injectable()
export class AutomationsWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<AutomationJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly automationsService: AutomationsService
  ) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const parsedRedisUrl = new URL(redisUrl);

    this.worker = new Worker<AutomationJobData>(
      AUTOMATION_QUEUE_NAME,
      async (job) => {
        if (!job.data.logId) {
          return { executed: false, reason: 'LOG_ID_MISSING' };
        }

        return this.automationsService.executeScheduledLog(job.data.logId);
      },
      {
        connection: {
          host: parsedRedisUrl.hostname,
          port: Number(parsedRedisUrl.port || 6379),
          username: parsedRedisUrl.username || undefined,
          password: parsedRedisUrl.password || undefined,
          db: parsedRedisUrl.pathname ? Number(parsedRedisUrl.pathname.slice(1) || 0) : 0
        }
      }
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
