import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JsonLoggerService } from './common/logging/json-logger.service';
import { ErrorMonitoringFilter } from './common/monitoring/error-monitoring.filter';
import { ErrorMonitoringService } from './common/monitoring/error-monitoring.service';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  app.useLogger(app.get(JsonLoggerService));
  const port = configService.get<number>('API_PORT', 3000);

  app.enableCors({
    origin: configService.get<string>('WEB_ORIGIN', 'http://localhost:5173'),
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );
  app.useGlobalFilters(new ErrorMonitoringFilter(app.get(ErrorMonitoringService)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AtendePix API')
    .setDescription('API do AtendePix')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}

bootstrap();
