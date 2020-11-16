import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionItemLogRepository } from './actionItemLog.repository';
import { ActionItemController } from './actionItem.controller';
import { ActionItemLogService } from './actionItemLog.service';
import { ActionItemLogGateway } from './actionItemLog.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([ActionItemLogRepository])],
  controllers: [ActionItemController],
  exports: [ActionItemLogService],
  providers: [ActionItemLogService, ActionItemLogGateway],
})
export class ActionItemModule {}
