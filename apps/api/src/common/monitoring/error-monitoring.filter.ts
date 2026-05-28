import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ErrorMonitoringService } from './error-monitoring.service';

type MonitoredRequest = {
  method?: string;
  url?: string;
  originalUrl?: string;
  user?: {
    userId?: string;
    tenantId?: string;
  };
};

@Catch()
export class ErrorMonitoringFilter implements ExceptionFilter {
  constructor(private readonly errorMonitoringService: ErrorMonitoringService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<MonitoredRequest>();
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.getMessage(exception);

    void this.errorMonitoringService.captureError({
      statusCode,
      method: request.method,
      path: request.originalUrl ?? request.url,
      userId: request.user?.userId,
      tenantId: request.user?.tenantId,
      message,
      stack: exception instanceof Error ? exception.stack : undefined
    });

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url
    });
  }

  private getMessage(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (this.isResponseObject(response)) {
        const message = response.message;
        return Array.isArray(message) ? message.join('; ') : message ?? exception.message;
      }

      return exception.message;
    }

    if (exception instanceof Error) {
      return exception.message || 'Erro interno do servidor.';
    }

    return 'Erro interno do servidor.';
  }

  private isResponseObject(value: unknown): value is { message?: string | string[] } {
    return typeof value === 'object' && value !== null && 'message' in value;
  }
}
