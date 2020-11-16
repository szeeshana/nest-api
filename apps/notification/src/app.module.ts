import { Module, forwardRef } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './shared/services/config.service';
import { SharedModule } from './shared/shared.module';
import { ActionTypeModule } from './modules/actionType/actionType.module';
import { ActivityLogModule } from './modules/activityLog/activityLog.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './cron/taskRunner';
import { EmailService } from './queue/emailQueue/producer';
import { BullModule } from '@nestjs/bull';
import { AddEmailTemplate } from './cron/addEmailTemplates';
import { EmailConsumer } from './queue/emailQueue/consumer';
import { AggregateActivityLogs } from './cron/aggreatedActivityLogsGenerator';
import { AddEmailTemplateForActivityLogs } from './cron/addEmailTemplatesForActivityLogs';
import { SendEmail } from './cron/sendEmail';
import { MailerModule } from '@nest-modules/mailer';
import { EmailModule } from './modules/emailTemplate/emailTemplate.module';
import { SendEmailModule } from './modules/sendEmail/sendEmail.module';
import { DefaultEmailTemplateModule } from './modules/defaultEmailTemplate/defaultEmailTemplate.module';
import { StageEmailSettingModule } from './modules/stageEmailSetting/stageEmailSetting.module';
import { AddEmailTemplatesForActionItemLogs } from './cron/addEmailTemplatesForActionItemLogs';
import { ActionItemAggregatedEmailsNotifications } from './cron/actionItemAggregatedEmailsNotifications';
import { ActionItemModule } from './modules/actionItem/actionItem.module';

const configService = new ConfigService();

@Module({
  imports: [
    BullModule.registerQueue({
      name: configService.get('EMAIL_QUEUE_NAME'),
      redis: {
        host: configService.get('REDIS_HOST'),
        port: parseInt(configService.get('REDIS_PORT')),
      },
    }),
    forwardRef(() => ScheduleModule.forRoot()),
    ActionItemModule,
    TypeOrmModule.forRootAsync({
      imports: [
        SharedModule,
        ActionTypeModule,
        ActivityLogModule,
        EmailModule,
        SendEmailModule,
        DefaultEmailTemplateModule,
        StageEmailSettingModule,
      ],
      useFactory: (configService: ConfigService) => configService.typeOrmConfig,
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: async (configService: ConfigService) => ({
        transport: configService.mailerTransporter,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TasksService,
    EmailService,
    AddEmailTemplate,
    EmailConsumer,
    AggregateActivityLogs,
    AddEmailTemplateForActivityLogs,
    SendEmail,
    AddEmailTemplatesForActionItemLogs,
    ActionItemAggregatedEmailsNotifications,
  ],
})
export class AppModule {}
