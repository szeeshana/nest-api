import { DefaultEmailTemplateRepository } from './../defaultEmailTemplate/defaultEmailTemplate.repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateRepository } from './emailTemplate.repository';
import { EmailTemplateController } from './emailTemplate.controller';
import { EmailTemplateService } from './emailTemplate.service';
import { DefaultEmailTemplateService } from '../defaultEmailTemplate/defaultEmailTemplate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailTemplateRepository,
      DefaultEmailTemplateRepository,
    ]),
  ],
  controllers: [EmailTemplateController],
  exports: [EmailTemplateService],
  providers: [EmailTemplateService, DefaultEmailTemplateService],
})
export class EmailModule {}
