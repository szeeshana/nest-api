import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../queue/emailQueue/producer';
import { getConnection } from 'typeorm';
import { SendEmailEntity } from '../modules/sendEmail/sendEmail.entity';
// import { ActivityLogEntity } from '../modules/activityLog/activityLog.entity';
import * as _ from 'lodash';
import { EMAIL_STATUSES } from '../common/constants/constants';
@Injectable()
export class SendEmail {
  private readonly logger = new Logger();
  constructor(private readonly emailService: EmailService) {}
  async main() {
    this.logger.log('IN SendEmail');
    const entityTypeData = await getConnection()
      .createQueryBuilder()
      .select('sendEmail')
      .from(SendEmailEntity, 'sendEmail')
      .where('sendEmail.status = :status', {
        status: 'pending',
      })
      .andWhere('sendEmail.emailContent like :emailContent', {
        emailContent: '<!DOCTYPE%',
      })
      .getMany();
    if (entityTypeData.length) {
      const sendEmailIds = _.map(entityTypeData, 'id');
      await getConnection()
        .createQueryBuilder()
        .update(SendEmailEntity)
        .set({
          status: EMAIL_STATUSES.SENT,
        })
        .where('id IN (:...ids)', {
          ids: sendEmailIds,
        })
        .execute();
      this.emailService.addInQueue(entityTypeData);
    } else {
      this.logger.error('No data in SendEmail Cron to process');
    }
  }
}
