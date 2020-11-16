import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../queue/emailQueue/producer';

@Injectable()
export class AddEmailTemplate {
  private readonly logger = new Logger();
  constructor(private readonly emailService: EmailService) {}
  addEmailTemplate() {
    Logger.log('asdsd');
    this.logger.log('Running Add Email Template ');
    this.emailService.addInQueue({ test: 'test' });
  }
}
