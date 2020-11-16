import { Injectable, Logger } from '@nestjs/common';
import { getConnection } from 'typeorm';
import * as _ from 'lodash';
import { EmailTemplateEntity } from '../modules/emailTemplate/emailTemplate.entity';

import { SendEmailEntity } from '../modules/sendEmail/sendEmail.entity';
import { ActionItemLogEntity } from '../modules/actionItem/actionItemLog.entity';
import { DefaultEmailTemplateEntity } from '../modules/defaultEmailTemplate/defaultEmailTemplate.entity';
import { StageEmailSettingEntity } from '../modules/stageEmailSetting/stageEmailSetting.entity';
import * as moment from 'moment';
import { UtilsService } from '../providers/utils.service';
@Injectable()
export class ActionItemAggregatedEmailsNotifications {
  private readonly logger = new Logger();
  async main() {
    Logger.log('Running AddEmailTemplatesForActionItemLogs');
    await this.logger.log('Running AddEmailTemplateForActivityLogs ');
    const defaultEmailTemplate = await getConnection()
      .createQueryBuilder()
      .select('defaultEmailTemplates')
      .from(DefaultEmailTemplateEntity, 'defaultEmailTemplates')
      .where('defaultEmailTemplates.name = :name', {
        name: 'Default Email Template',
      })
      .getOne();
    const stageEmailSettingsData = await getConnection()
      .createQueryBuilder()
      .select('stageEmailSettings')
      .from(StageEmailSettingEntity, 'stageEmailSettings')
      .where('stageEmailSettings.isCompleted = :isCompleted', {
        isCompleted: 0,
      })
      .getMany();
    if (stageEmailSettingsData.length) {
      const updateObject = {};
      const updateArr = [];
      const selectedStageEmailSettingsData = [];

      _.map(stageEmailSettingsData, (val: StageEmailSettingEntity) => {
        if (!_.isEmpty(val.nextRun)) {
          if (
            moment(val.nextRun).isBefore(
              moment()
                .utc()
                .format(),
            )
          ) {
            this.logger.log('RUN EMAIL TEMP');
            updateObject['nextRun'] = moment(val.nextRun)
              .add('hours', val.reminderFrequency)
              .format();
            updateObject['lastRun'] = moment.utc().format();
            selectedStageEmailSettingsData.push(val);
          }
        } else {
          this.logger.log('RUN EMAIL TEMP E');
          updateObject['nextRun'] = moment()
            .add('hours', val.reminderFrequency)
            .utc()
            .format();
          updateObject['lastRun'] = moment.utc().format();
          selectedStageEmailSettingsData.push(val);
        }
        const tempQuery = getConnection()
          .createQueryBuilder()
          .update(StageEmailSettingEntity)
          .set(updateObject)
          .where('id = :id', {
            id: val.id,
          })
          .execute();
        updateArr.push(tempQuery);
      });
      Promise.all(updateArr).then(_res => {
        this.logger.log('Updted configs for email templates');
      });

      const dataFromActionItem = [];
      _.map(selectedStageEmailSettingsData, (val: StageEmailSettingEntity) => {
        dataFromActionItem.push(
          getConnection()
            .createQueryBuilder()
            .select('actionItem')
            .from(ActionItemLogEntity, 'actionItem')
            .where('actionItem.isEmailCreated = :isEmailCreated', {
              isEmailCreated: 0,
            })
            .andWhere('actionItem.userId = :userId', {
              userId: val.userId,
            })
            .andWhere('actionItem.community = :community', {
              community: val.community,
            })
            // .andWhere('actionItem.actionItemId = :actionItemId', {
            //   actionItemId: val.actionItemId,
            // })
            .getMany(),
        );
      });
      const entityTypeData = _.flatMap(await Promise.all(dataFromActionItem));
      if (entityTypeData.length) {
        const communityWiseData = _.groupBy(entityTypeData, 'community');
        const allCommunityIds = _.uniq(_.map(entityTypeData, 'community'));
        const communityEmailTemplates = await getConnection()
          .createQueryBuilder()
          .select('emailTemplates')
          .from(EmailTemplateEntity, 'emailTemplates')
          .leftJoinAndSelect('emailTemplates.actionType', 'actionType')
          .where('community IN (:...ids)', {
            ids: allCommunityIds,
          })
          .andWhere('emailTemplates.isDeleted = :isDeleted', {
            isDeleted: false,
          })
          .andWhere('emailTemplates.name = :name', {
            name: 'Action Items Log',
          })
          .getMany();
        const communityWiseTemplates = _.groupBy(
          communityEmailTemplates,
          'community',
        );
        let sendEmailData = [];
        const updateActionItemLogTable = [];

        for (const iterator in communityWiseData) {
          const tempQuery = getConnection()
            .createQueryBuilder()
            .update(ActionItemLogEntity)
            .set({
              isEmailCreated: 1,
            })
            .where('id IN (:...ids)', {
              ids: _.map(communityWiseData[iterator], 'id'),
            })
            .execute();
          updateActionItemLogTable.push(tempQuery);
          if (communityWiseData[iterator] && communityWiseTemplates[iterator]) {
            const temp = this.createDataForSendEmail(
              communityWiseData[iterator],
              communityWiseTemplates[iterator],
              defaultEmailTemplate,
            );
            if (!_.isEmpty(temp['emailContent:'])) {
              sendEmailData.push(
                this.createDataForSendEmail(
                  communityWiseData[iterator],
                  communityWiseTemplates[iterator],
                  defaultEmailTemplate,
                ),
              );
            }
          }
        }
        sendEmailData = _.flatMap(sendEmailData);
        if (sendEmailData.length) {
          await getConnection()
            .createQueryBuilder()
            .insert()
            .into(SendEmailEntity)
            .values(sendEmailData)
            .execute();

          await Promise.all(updateActionItemLogTable);
        }
      } else {
        Logger.warn('NO Aggregated Action Item Logs TO PROCESS');
      }
    } else {
      Logger.warn('NO Aggregated Action Item Logs TO PROCESS');
    }
  }
  createDataForSendEmail(
    communityData,
    _communityEmailTemplates,
    defaultEmailTemplate,
  ) {
    const sendEmailData = [];
    const selectedEmailTemplates = _communityEmailTemplates;

    _.map(communityData, (val: any) => {
      if (!_.isEmpty(selectedEmailTemplates)) {
        sendEmailData.push({
          to: val.userEmail,
          from: selectedEmailTemplates[0].senderEmail,
          emailContent: this.createEmailContent(
            selectedEmailTemplates[0].body,
            selectedEmailTemplates[0].footerSection,
            val,
            defaultEmailTemplate,
          ),
          community: val.community,
        });
      }
    });
    return sendEmailData;
  }
  createEmailContent(
    body,
    _footerText,
    actionItemLogObject: ActionItemLogEntity,
    defaultEmailTemplate: DefaultEmailTemplateEntity,
  ) {
    const liLists = `<li>
    <p><string>Complete ${
      actionItemLogObject.actionItemTitle
    } task to complete on ${actionItemLogObject.entityTitle}</string></p>
    <p>${
      actionItemLogObject.entityOperendObject &&
      actionItemLogObject.entityOperendObject['detailedMessage']
        ? actionItemLogObject.entityOperendObject['detailedMessage']
        : 'Message'
    }</p>
    ${UtilsService.getButtonLinkForEmails(actionItemLogObject.url)}
    `;
    const innerHtml = `<ul>
      ${liLists}
    </ul>`;

    body = body.replace(
      '{{communityName}}',
      actionItemLogObject['communityName']
        ? actionItemLogObject['communityName']
        : 'Community Name',
    );
    body = body + innerHtml;
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{tagLine}}',
      '',
    );
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{body}}',
      body,
    );
    defaultEmailTemplate.body = defaultEmailTemplate.footerSection.replace(
      '{{companyName}}',
      actionItemLogObject['communityName']
        ? actionItemLogObject['communityName']
        : 'Community Name',
    );

    return defaultEmailTemplate.body;
  }
}
