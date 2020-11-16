import { Injectable, Logger } from '@nestjs/common';
import { getConnection } from 'typeorm';
import * as _ from 'lodash';
import { EmailTemplateEntity } from '../modules/emailTemplate/emailTemplate.entity';

import { SendEmailEntity } from '../modules/sendEmail/sendEmail.entity';
import * as moment from 'moment';
import { ActionItemLogEntity } from '../modules/actionItem/actionItemLog.entity';
import { DefaultEmailTemplateEntity } from '../modules/defaultEmailTemplate/defaultEmailTemplate.entity';
import { UtilsService } from '../providers/utils.service';
import { EMAIL_BOOKMARKS } from '../common/constants/constants';
@Injectable()
export class AddEmailTemplatesForActionItemLogs {
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
    const entityTypeData = await getConnection()
      .createQueryBuilder()
      .select('actionItem')
      .from(ActionItemLogEntity, 'actionItem')
      .where('actionItem.isEmailCreated = :isEmailCreated', {
        isEmailCreated: 0,
      })
      .andWhere('actionItem.isEmail = :isEmail', {
        isEmail: true,
      })
      .getMany();

    if (entityTypeData.length) {
      const communityWiseData = _.groupBy(entityTypeData, 'community');
      Logger.log(communityWiseData, 'communityWiseData');

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
          sendEmailData.push(
            this.createDataForSendEmail(
              communityWiseData[iterator],
              communityWiseTemplates[iterator],
              defaultEmailTemplate,
            ),
          );
        }
      }
      sendEmailData = _.flatMap(sendEmailData);

      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(SendEmailEntity)
        .values(sendEmailData)
        .execute();
      await Promise.all(updateActionItemLogTable);
    } else {
      Logger.warn('NO Action Item Logs TO PROCESS');
    }
  }
  createDataForSendEmail(
    communityData,
    _communityEmailTemplates,
    defaultEmailTemplate,
  ) {
    const sendEmailData = [];
    const selectedEmailTemplates = [];
    const updatyeEmmailTemplatesArr = [];
    const updateObject = {};

    _.map(_communityEmailTemplates, (valEmailEntity: EmailTemplateEntity) => {
      if (!_.isEmpty(valEmailEntity.nextRun)) {
        if (
          moment(valEmailEntity.nextRun).isBefore(
            moment()
              .utc()
              .format(),
          )
        ) {
          this.logger.log('RUN EMAIL TEMP');
          updateObject['nextRun'] = moment(valEmailEntity.nextRun)
            .add('hours', valEmailEntity.frequency)
            .format();
          updateObject['lastRun'] = moment.utc().format();
          selectedEmailTemplates.push(valEmailEntity);
        }
      } else {
        this.logger.log('RUN EMAIL TEMP E');
        updateObject['nextRun'] = moment()
          .add('hours', valEmailEntity.frequency)
          .utc()
          .format();
        updateObject['lastRun'] = moment.utc().format();
        selectedEmailTemplates.push(valEmailEntity);
      }
      const tempQuery = getConnection()
        .createQueryBuilder()
        .update(EmailTemplateEntity)
        .set(updateObject)
        .where('id = :id', {
          id: valEmailEntity.id,
        })
        .execute();
      updatyeEmmailTemplatesArr.push(tempQuery);
    });
    Promise.all(updatyeEmmailTemplatesArr).then(_res => {
      this.logger.log('Updated configs for email templates');
    });
    Logger.log('DOne Here');
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
            this.updateSubject(selectedEmailTemplates[0].subject, val),
          ),
          community: val.community,
          subject: this.updateSubject(selectedEmailTemplates[0].subject, val),
        });
      }
    });
    return sendEmailData;
  }
  createEmailContent(
    _body,
    _footerText,
    _actionItemLogObject: ActionItemLogEntity,
    _defaultEmailTemplate: DefaultEmailTemplateEntity,
    updatedSubject: string,
  ) {
    let body = _.cloneDeep(_body);
    const actionItemLogObject = _.cloneDeep(_actionItemLogObject);
    const defaultEmailTemplate = _.cloneDeep(_defaultEmailTemplate);
    this.logger.log('Inside createEmailContent');
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
      '{{ subject }}',
      updatedSubject,
    );
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{body}}',
      body,
    );
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{companyName}}',
      actionItemLogObject['communityName']
        ? actionItemLogObject['communityName']
        : 'Community Name',
    );

    defaultEmailTemplate.footerSection = defaultEmailTemplate.footerSection.replace(
      '{{companyName}}',
      actionItemLogObject['communityName']
        ? actionItemLogObject['communityName']
        : 'Community Name',
    );
    return defaultEmailTemplate.body;
  }
  updateSubject(subject, actionItemLogObject: ActionItemLogEntity): string {
    let subjectText = subject;

    subjectText = subjectText.replace(
      EMAIL_BOOKMARKS.OPPORTUNITY_TITLE,
      actionItemLogObject.entityTitle,
    );
    subjectText = subjectText.replace(
      EMAIL_BOOKMARKS.FIRST_NAME,
      actionItemLogObject.userName,
    );

    return subjectText;
  }
}
