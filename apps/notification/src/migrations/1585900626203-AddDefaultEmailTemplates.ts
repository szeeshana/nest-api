import { MigrationInterface, QueryRunner } from 'typeorm';
import * as _ from 'lodash';

export class AddDefaultEmailTemplates1585900626203
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const entityTypeData = await queryRunner.query(
      `select * from public.action_type`,
      undefined,
    );

    const genericDataforEmail = {
      cronName: 'Mention User on an Idea',
      senderName: 'demoTestApp Notifications',
      senderEmail: 'support@demoTestApp.com',
      subjectLine:
        '{{FirstName}} (Anonymous) mentioned you in their submission of {{ideaname}}',
      body: `{{FirstName}} (Anonymous) mentioned you in their idea submission
                  {{ideaNumber}} {{ideaTitle}}
                  {{ideaDescription}}`,
      frequency: 1,
      timeZone: 'Asia/Karachi',
      runAt: '',
      nextRun: '',
      lastRun: '',
      actionType: '',
      footerSection: 'Footer text here',
    };
    let bulkInsertData = '';
    _.mapValues(entityTypeData, function(o: any) {
      const tempObject = {
        name: genericDataforEmail.cronName,
        featureImage:
          'https://demoTestApp-test.s3.us-east-2.amazonaws.com/assets/emails/email_banner.png',
        senderName: genericDataforEmail.senderName,
        senderEmail: genericDataforEmail.senderEmail,
        subject: genericDataforEmail.subjectLine,
        body: genericDataforEmail.body,
        frequency: genericDataforEmail.frequency,
        timeZone: genericDataforEmail.timeZone,
        runAt: genericDataforEmail.runAt,
        nextRun: genericDataforEmail.lastRun,
        lastRun: genericDataforEmail.lastRun,
        actionType: o.id,
        footerSection: genericDataforEmail.footerSection,
      };
      switch (o.abbreviation) {
        case 'follow':
          tempObject.name = 'Follow';
          tempObject.subject =
            '{{FirstName}} followed your {{entityName}} {{entityTitle}}';
          tempObject.body =
            '{{FirstName}} followed your {{entityName}} {{entityTitle}}';
          break;
        case 'upvote':
          tempObject.name = 'Edit';
          tempObject.subject =
            '{{FirstName}} upvoted your {{entityName}} {{entityTitle}}';
          tempObject.body =
            '{{FirstName}} upvoted your {{entityName}} {{entityTitle}}';
          break;
        case 'edit':
          tempObject.name = 'Upvote';
          tempObject.subject =
            '{{FirstName}} edited {{entityName}} {{entityTitle}}';
          tempObject.body =
            '{{FirstName}} edited {{entityName}} {{entityTitle}}';
          break;
        case 'comment':
          tempObject.name = 'Comment';
          tempObject.subject =
            '{{FirstName}} commented on {{entityName}} {{entityTitle}}';
          tempObject.body =
            '{{FirstName}} commented on {{entityName}} {{entityTitle}}';
          break;
        case 'post':
          tempObject.name = 'Post';
          tempObject.subject =
            '{{FirstName}} posted {{entityName}} {{entityTitle}}';
          tempObject.body =
            '{{FirstName}} posted {{entityName}} {{entityTitle}}';
          break;
        default:
          break;
      }
      bulkInsertData =
        bulkInsertData +
        `(DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, '${tempObject.name}', '${tempObject.subject}', '${tempObject.body}', '${tempObject.featureImage}', '${tempObject.footerSection}', '${tempObject.frequency}', '${tempObject.timeZone}', '${tempObject.runAt}', '${tempObject.nextRun}', '${tempObject.lastRun}', '${tempObject.senderName}', '${tempObject.senderEmail}', '${tempObject.actionType}'),`;
    });
    bulkInsertData = bulkInsertData.replace(/,\s*$/, '');

    await queryRunner.query(
      `INSERT INTO "default_email_template"("created_at", "updated_at", "is_deleted", "updated_by", "created_by", "name", "subject", "body", "feature_image", "footer_section", "frequency", "time_zone", "run_at", "next_run", "last_run", "sender_name", "sender_email", "action_type_id") VALUES ${bulkInsertData}`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `delete from public.default_email_template`,
      undefined,
    );
  }
}
