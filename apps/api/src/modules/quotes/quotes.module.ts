import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PublicQuotesController, QuotesController } from './quotes.controller';
import { QuotePdfService } from './quote-pdf.service';
import { QuotesService } from './quotes.service';

@Module({
  imports: [AuthModule],
  controllers: [QuotesController, PublicQuotesController],
  providers: [QuotesService, QuotePdfService]
})
export class QuotesModule {}
