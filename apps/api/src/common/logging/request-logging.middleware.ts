import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { JsonLoggerService } from './json-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: JsonLoggerService
  ) {}

  use(request: Request, response: Response, next: NextFunction) {
    if (this.configService.get<string>('REQUEST_LOGGING_ENABLED', 'true') === 'false') {
      next();
      return;
    }

    const startedAt = process.hrtime.bigint();
    const requestId = request.headers['x-request-id']?.toString() ?? randomUUID();

    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const user = (request as Request & { user?: { userId?: string; tenantId?: string } }).user;

      this.logger.http({
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs),
        userId: user?.userId,
        tenantId: user?.tenantId,
        userAgent: request.headers['user-agent']
      });
    });

    next();
  }
}
