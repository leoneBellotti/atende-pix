import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';

type LogPayload = {
  level: LogLevel;
  message: unknown;
  context?: string;
  trace?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class JsonLoggerService implements LoggerService {
  constructor(private readonly configService: ConfigService) {}

  log(message: unknown, context?: string) {
    this.write({ level: 'log', message, context });
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write({ level: 'error', message, trace, context });
  }

  warn(message: unknown, context?: string) {
    this.write({ level: 'warn', message, context });
  }

  debug(message: unknown, context?: string) {
    this.write({ level: 'debug', message, context });
  }

  verbose(message: unknown, context?: string) {
    this.write({ level: 'verbose', message, context });
  }

  fatal(message: unknown, trace?: string, context?: string) {
    this.write({ level: 'fatal', message, trace, context });
  }

  http(metadata: Record<string, unknown>) {
    this.write({
      level: 'log',
      message: 'http_request',
      context: 'HttpRequest',
      metadata
    });
  }

  private write(payload: LogPayload) {
    if (!this.isEnabled(payload.level)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      service: 'atende-pix-api',
      level: payload.level,
      context: payload.context,
      message: this.formatMessage(payload.message),
      trace: payload.trace,
      ...payload.metadata
    };

    const line = JSON.stringify(entry);

    if (payload.level === 'error' || payload.level === 'fatal') {
      console.error(line);
      return;
    }

    if (payload.level === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  private isEnabled(level: LogLevel) {
    if (this.configService.get<string>('STRUCTURED_LOGGING_ENABLED', 'true') === 'false') {
      return false;
    }

    if (level === 'debug' || level === 'verbose') {
      return this.configService.get<string>('STRUCTURED_LOGGING_VERBOSE', 'false') === 'true';
    }

    return true;
  }

  private formatMessage(message: unknown) {
    if (typeof message === 'string') {
      return message;
    }

    if (message instanceof Error) {
      return message.message;
    }

    return JSON.stringify(message);
  }
}
