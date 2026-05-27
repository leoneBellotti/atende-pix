import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';

@Module({
  imports: [AuthModule],
  controllers: [AttendancesController],
  providers: [AttendancesService]
})
export class AttendancesModule {}
