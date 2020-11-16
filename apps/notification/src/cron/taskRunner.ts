import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { AggregateActivityLogs } from './aggreatedActivityLogsGenerator';
import { AddEmailTemplateForActivityLogs } from './addEmailTemplatesForActivityLogs';
import { SendEmail } from './sendEmail';
import { ConfigService } from '../shared/services/config.service';
import { AddEmailTemplatesForActionItemLogs } from './addEmailTemplatesForActionItemLogs';
import { ActionItemAggregatedEmailsNotifications } from './actionItemAggregatedEmailsNotifications';

const configService = new ConfigService();
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly addEmailTemplateForActivityLogs: AddEmailTemplateForActivityLogs,
    private readonly sendEmail: SendEmail,
    private readonly aggregateActivityLogs: AggregateActivityLogs,
    private readonly addEmailTemplatesForActionItemLogs: AddEmailTemplatesForActionItemLogs,
    private readonly actionItemAggregatedEmailsNotifications: ActionItemAggregatedEmailsNotifications,
  ) {}

  @Interval(configService.getNumber('NOTIFICATIONS_CRON_INTERVAL'))
  async handleCron(): Promise<void> {
    this.logger.log('Running Task Runner');
    this.aggregateActivityLogs.main();
    this.addEmailTemplateForActivityLogs.main();
    this.sendEmail.main();
    this.addEmailTemplatesForActionItemLogs.main();
    this.actionItemAggregatedEmailsNotifications.main();
  }
}
