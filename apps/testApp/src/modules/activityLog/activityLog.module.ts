import { Module, forwardRef } from '@nestjs/common';
import { ActivityLogController } from './activityLog.controller';
import { ActivityLogService } from './activityLog.service';
import { MicroServiceClient } from '../../common/microServiceClient/microServiceClient';
import { ChallengeModule } from '../challenge/challenge.module';

@Module({
  imports: [forwardRef(() => ChallengeModule)],
  controllers: [ActivityLogController],
  exports: [],
  providers: [ActivityLogService, MicroServiceClient],
})
export class ActivityLogModule {}
