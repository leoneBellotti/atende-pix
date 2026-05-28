import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JsonLoggerService } from './json-logger.service';
import { RequestLoggingMiddleware } from './request-logging.middleware';

@Module({
  providers: [JsonLoggerService, RequestLoggingMiddleware],
  exports: [JsonLoggerService]
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
