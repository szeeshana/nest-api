import { Injectable, Logger } from '@nestjs/common';
import { ActivityLogEntity } from '../modules/activityLog/activityLog.entity';
import { getConnection } from 'typeorm';
import * as _ from 'lodash';
import { EmailTemplateEntity } from '../modules/emailTemplate/emailTemplate.entity';
import { EMAIL_BOOKMARKS } from '../common/constants/constants';
import { SendEmailEntity } from '../modules/sendEmail/sendEmail.entity';
import * as moment from 'moment';
import { DefaultEmailTemplateEntity } from '../modules/defaultEmailTemplate/defaultEmailTemplate.entity';
@Injectable()
export class AddEmailTemplateForActivityLogs {
  private readonly logger = new Logger();
  async main() {
    Logger.log('ININ');
    await this.logger.log('Running AddEmailTemplateForActivityLogs ');

    const entityTypeData = await getConnection()
      .createQueryBuilder()
      .select('activityLog')
      .from(ActivityLogEntity, 'activityLog')
      .leftJoinAndSelect('activityLog.actionType', 'actionType')
      .where('activityLog.isEmail = :isEmail', {
        isEmail: true,
      })
      .andWhere('activityLog.createEmail = :createEmail', {
        createEmail: 0,
      })
      .getMany();
    const defaultEmailTemplate = await getConnection()
      .createQueryBuilder()
      .select('defaultEmailTemplates')
      .from(DefaultEmailTemplateEntity, 'defaultEmailTemplates')
      .where('defaultEmailTemplates.name = :name', {
        name: 'Default Email Template',
      })
      .getOne();

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
        .getMany();
      const communityWiteTemplates = _.groupBy(
        communityEmailTemplates,
        'community',
      );
      let sendEmailData = [];
      const updateActivityLogTable = [];

      for (const iterator in communityWiseData) {
        const tempQuery = getConnection()
          .createQueryBuilder()
          .update(ActivityLogEntity)
          .set({
            createEmail: 1,
          })
          .where('id IN (:...ids)', {
            ids: _.map(communityWiseData[iterator], 'id'),
          })
          .execute();
        updateActivityLogTable.push(tempQuery);
        if (
          !_.isEmpty(communityWiseData[iterator.toString()]) &&
          !_.isEmpty(communityWiteTemplates[iterator.toString()])
        ) {
          sendEmailData.push(
            this.createDataForSendEmail(
              defaultEmailTemplate,
              communityWiseData[iterator],
              communityWiteTemplates[iterator],
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

      await Promise.all(updateActivityLogTable);
    } else {
      Logger.warn('NO ACTIVITY LOGS TO PROCESS');
    }
  }
  createDataForSendEmail(
    defaultEmailTemplate,
    communityData,
    _communityEmailTemplates,
  ) {
    const sendEmailData = [];
    const selectedEmailTemplates = [];
    const updateEmailTemplatesArr = [];
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
      updateEmailTemplatesArr.push(tempQuery);
    });
    Promise.all(updateEmailTemplatesArr).then(_res => {
      this.logger.log('Updted configs for email templates');
    });
    _.map(communityData, (val: any) => {
      const foundTemplate: EmailTemplateEntity = _.find(
        selectedEmailTemplates,
        function(o) {
          if (
            o.actionType &&
            o.actionType.id &&
            val.actionType &&
            val.actionType.id
          ) {
            return o.actionType && o.actionType.id === val.actionType.id;
          }
        },
      );
      if (!_.isEmpty(foundTemplate)) {
        sendEmailData.push({
          to: val.userEmail,
          from: foundTemplate.senderEmail,
          emailContent: this.createEmailContent(
            defaultEmailTemplate,
            foundTemplate,
            val,
          ),
          community: val.community,
          subject: this.updateSubject(foundTemplate.subject, val),
        });
      }
    });
    return sendEmailData;
  }
  createEmailContent(
    _defaultEmailTemplate,
    _foundTemplate,
    _activityLogObject: ActivityLogEntity,
  ) {
    const defaultEmailTemplate = _.cloneDeep(_defaultEmailTemplate);
    const foundTemplate = _.cloneDeep(_foundTemplate);
    const activityLogObject = _.cloneDeep(_activityLogObject);

    foundTemplate.body = foundTemplate.body.replace(
      EMAIL_BOOKMARKS.FIRST_NAME,
      activityLogObject.actorUserName,
    );
    foundTemplate.body = foundTemplate.body.replace(
      EMAIL_BOOKMARKS.OPPORTUNITY_NUMBER,
      activityLogObject.entityId,
    );
    foundTemplate.body = foundTemplate.body.replace(
      EMAIL_BOOKMARKS.OPPORTUNITY_TITLE,
      activityLogObject.entityTitle,
    );
    foundTemplate.body = foundTemplate.body.replace(
      EMAIL_BOOKMARKS.OPPORTUNITY_DESCRIPTION,
      activityLogObject.entityDescription,
    );

    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{tagLine}}',
      '',
    );
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{ subject }}',
      this.updateSubject(foundTemplate.subject, activityLogObject),
    );
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{body}}',
      foundTemplate.body + '<br>' + foundTemplate.footerSection,
    );
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{companyName}}',
      activityLogObject['communityName']
        ? activityLogObject['communityName']
        : 'Community Name',
    );
    defaultEmailTemplate.footerSection = defaultEmailTemplate.footerSection.replace(
      '{{companyName}}',
      activityLogObject['communityName']
        ? activityLogObject['communityName']
        : 'Community Name',
    );
    defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
      '{{featureImage}}',
      foundTemplate.featureImage,
    );

    // Replacing Entity Operand Object's values.
    const operandObjectBookmarkQueries = {
      ['{{currentWorkflowTitle}}']: 'currentWorkflow.title',
      ['{{previousWorkflowTitle}}']: 'previousWorkflow.title',
      ['{{currentStageTitle}}']: 'currentStage.title',
      ['{{currentStageDescription}}']: 'currentStage.description',
      ['{{previousStageTitle}}']: 'previousStage.title',
      ['{{customMessage}}']: 'message',
    };
    _.forEach(operandObjectBookmarkQueries, (query, key) => {
      defaultEmailTemplate.body = defaultEmailTemplate.body.replace(
        key,
        _.get(activityLogObject.entityOperendObject, query, ''),
      );
    });

    return defaultEmailTemplate.body;
  }
  updateSubject(subject, activityLogObject: ActivityLogEntity): string {
    let subjectText = subject;
    subjectText = subjectText.replace(
      EMAIL_BOOKMARKS.OPPORTUNITY_NUMBER,
      activityLogObject.entityId,
    );
    subjectText = subjectText.replace(
      EMAIL_BOOKMARKS.OPPORTUNITY_TITLE,
      activityLogObject.entityTitle,
    );
    subjectText = subjectText.replace(
      EMAIL_BOOKMARKS.FIRST_NAME,
      activityLogObject.actorUserName,
    );
    return subjectText;
  }
}
