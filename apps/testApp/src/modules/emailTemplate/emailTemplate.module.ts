import { Module } from '@nestjs/common';
import { EmailTemplatesController } from './emailTemplate.controller';
import { EmailTemplateService } from './emailTemplate.service';
import { MicroServiceClient } from '../../common/microServiceClient/microServiceClient';

@Module({
  imports: [],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplateService, MicroServiceClient],
})
export class EmailTemplateModule {}
