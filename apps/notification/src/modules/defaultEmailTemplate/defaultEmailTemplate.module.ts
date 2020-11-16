import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DefaultEmailTemplateRepository } from './defaultEmailTemplate.repository';
import { DefaultEmailTemplateController } from './defaultEmailTemplate.controller';
import { DefaultEmailTemplateService } from './defaultEmailTemplate.service';

@Module({
  imports: [TypeOrmModule.forFeature([DefaultEmailTemplateRepository])],
  controllers: [DefaultEmailTemplateController],
  exports: [DefaultEmailTemplateService],
  providers: [DefaultEmailTemplateService],
})
export class DefaultEmailTemplateModule {}
