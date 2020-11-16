import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import * as _ from 'lodash';
import { SendEmailEntity } from '../../modules/sendEmail/sendEmail.entity';
import { MailService } from '../../shared/services/mailer.service';
import { ConfigService } from '../../shared/services/config.service';

const configService = new ConfigService();

@Processor(configService.get('EMAIL_QUEUE_NAME'))
export class EmailConsumer {
  constructor(private mailService: MailService) {}
  @Process()
  async transcode(job: Job<any>) {
    let progress = 0;
    const sendEmailPromise = [];
    _.map(job.data, (val: SendEmailEntity) => {
      sendEmailPromise.push(
        this.mailService.sendEmail(
          val.to,
          val.from,
          val.emailContent,
          val.subject,
        ),
      );
    });
    await Promise.all(sendEmailPromise);
    progress += 10;
    job.progress(progress);
    return {};
  }
}
