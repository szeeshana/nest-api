import { ExceptionFilter } from './../../filters/rpcException.filter';
import { Controller, Logger, UseFilters } from '@nestjs/common';
import { SendEmailService } from './sendEmail.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class SendEmailController {
  private logger = new Logger('Notification controller');

  constructor(private readonly sendEmailService: SendEmailService) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('getSendEmails')
  async getSendEmails(queryParams: {}): Promise<{}> {
    this.logger.log(queryParams, 'Msg Dispatch From Notification Service');
    const sendEmails = await this.sendEmailService.getSendEmails({
      where: queryParams,
    });
    return sendEmails;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('addSendEmailsData')
  async addEmails(data: {} | []): Promise<{}> {
    const addedData = await this.sendEmailService.addSendEmail(data);
    return addedData;
  }
}
