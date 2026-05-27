import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PublicQuotesController, QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [AuthModule],
  controllers: [QuotesController, PublicQuotesController],
  providers: [QuotesService]
})
export class QuotesModule {}
