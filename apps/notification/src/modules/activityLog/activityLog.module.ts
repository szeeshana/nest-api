import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogRepository } from './activityLog.repository';
import { ActivityLogController } from './activityLog.controller';
import { ActivityLogService } from './activityLog.service';
import { ActivityLogGateway } from './activityLog.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogRepository])],
  controllers: [ActivityLogController],
  exports: [ActivityLogService],
  providers: [ActivityLogService, ActivityLogGateway],
})
export class ActivityLogModule {}
