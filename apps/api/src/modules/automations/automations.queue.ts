import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export const AUTOMATION_QUEUE_NAME = 'automation-jobs';

@Injectable()
export class AutomationsQueue implements OnModuleDestroy {
  private readonly queue: Queue;

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const parsedRedisUrl = new URL(redisUrl);

    this.queue = new Queue(AUTOMATION_QUEUE_NAME, {
      connection: {
        host: parsedRedisUrl.hostname,
        port: Number(parsedRedisUrl.port || 6379),
        username: parsedRedisUrl.username || undefined,
        password: parsedRedisUrl.password || undefined,
        db: parsedRedisUrl.pathname ? Number(parsedRedisUrl.pathname.slice(1) || 0) : 0
      }
    });
  }

  async enqueueAutomationLog(input: { logId: string; scheduledFor?: Date | null }) {
    const delay = input.scheduledFor
      ? Math.max(input.scheduledFor.getTime() - Date.now(), 0)
      : 0;

    await this.queue.add(
      'automation-log',
      {
        logId: input.logId
      },
      {
        delay,
        jobId: input.logId,
        removeOnComplete: true,
        removeOnFail: 100
      }
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
