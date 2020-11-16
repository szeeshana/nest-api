import { Injectable } from '@nestjs/common';
import { MailerService } from '@nest-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendEmail(to, from, html, subject): Promise<void> {
    return this.mailerService
      .sendMail({
        to: to,
        from: 'demoTestApp ' + (from || 'noreply@demoTestApp.com'),
        subject: subject || 'demoTestApp ',
        html: html,
      })
      .then(resp => {
        return resp;
      })
      .catch(err => {
        throw err;
      });
  }
}
