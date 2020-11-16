import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendEmailRepository } from './sendEmail.repository';
import { SendEmailController } from './sendEmail.controller';
import { SendEmailService } from './sendEmail.service';

@Module({
  imports: [TypeOrmModule.forFeature([SendEmailRepository])],
  controllers: [SendEmailController],
  exports: [SendEmailService],
  providers: [SendEmailService],
})
export class SendEmailModule {}
