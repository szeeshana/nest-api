import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StageEmailSettingRepository } from './stageEmailSetting.repository';
import { StageEmailSettingController } from './stageEmailSetting.controller';
import { StageEmailSettingService } from './stageEmailSetting.service';

@Module({
  imports: [TypeOrmModule.forFeature([StageEmailSettingRepository])],
  controllers: [StageEmailSettingController],
  exports: [StageEmailSettingService],
  providers: [StageEmailSettingService],
})
export class StageEmailSettingModule {}
