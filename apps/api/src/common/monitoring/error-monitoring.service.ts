import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ErrorContext = {
  statusCode: number;
  method?: string;
  path?: string;
  userId?: string;
  tenantId?: string;
  message: string;
  stack?: string;
};

@Injectable()
export class ErrorMonitoringService {
  constructor(private readonly configService: ConfigService) {}

  async captureError(context: ErrorContext) {
    if (!this.isEnabled() || !this.shouldCapture(context.statusCode)) {
      return;
    }

    const logPath = resolve(this.configService.get<string>('ERROR_LOG_PATH', '.logs/api-errors.log'));
    const payload = {
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      ...context
    };

    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, `${JSON.stringify(payload)}\n`, 'utf8');
  }

  private isEnabled() {
    return this.configService.get<string>('ERROR_MONITORING_ENABLED', 'true') !== 'false';
  }

  private shouldCapture(statusCode: number) {
    if (statusCode >= 500) {
      return true;
    }

    return this.configService.get<string>('ERROR_MONITORING_CAPTURE_4XX', 'false') === 'true';
  }
}
