import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../common/audit/audit.module';
import { LoggingModule } from '../common/logging/logging.module';
import { MonitoringModule } from '../common/monitoring/monitoring.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RateLimitingModule } from '../common/rate-limiting/rate-limiting.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AttendancesModule } from './attendances/attendances.module';
import { AutomationsModule } from './automations/automations.module';
import { BillingModule } from './billing/billing.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { QuotesModule } from './quotes/quotes.module';
import { SettingsModule } from './settings/settings.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env']
    }),
    AuditModule,
    LoggingModule,
    MonitoringModule,
    RateLimitingModule,
    PrismaModule,
    AdminModule,
    AiModule,
    AttendancesModule,
    AutomationsModule,
    BillingModule,
    AuthModule,
    CatalogModule,
    CustomersModule,
    DashboardModule,
    HealthModule,
    OrdersModule,
    PaymentsModule,
    QuotesModule,
    SettingsModule,
    WhatsAppModule
  ]
})
export class AppModule {}
