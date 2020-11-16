import { MigrationInterface, QueryRunner } from 'typeorm';
import { EMAIL_BOOKMARKS } from '../common/constants/constants';

export class UpdateDefaultEmailTemplates1588072919756
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const updatedTemplates = [
      {
        name: 'Post',
        updatedName: 'Post an Opportunity',
        subject: `${EMAIL_BOOKMARKS.FIRST_NAME} posted an opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
        body: `${EMAIL_BOOKMARKS.FIRST_NAME} posted an opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
      },
      {
        name: 'Edit',
        updatedName: 'Edit an Opportunity',
        subject: `${EMAIL_BOOKMARKS.FIRST_NAME} edited an opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
        body: `${EMAIL_BOOKMARKS.FIRST_NAME} edited an opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
      },
      {
        name: 'Follow',
        updatedName: 'Follow an Opportunity',
        subject: `${EMAIL_BOOKMARKS.FIRST_NAME} followed your opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
        body: `${EMAIL_BOOKMARKS.FIRST_NAME} followed your opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
      },
      {
        name: 'Upvote',
        updatedName: 'Upvote an Opportunity',
        subject: `${EMAIL_BOOKMARKS.FIRST_NAME} upvoted your opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
        body: `${EMAIL_BOOKMARKS.FIRST_NAME} upvoted your opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
      },
      {
        name: 'Comment',
        updatedName: 'Comment on an Opportunity',
        subject: `${EMAIL_BOOKMARKS.FIRST_NAME} commented on opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
        body: `${EMAIL_BOOKMARKS.FIRST_NAME} commented on opportunity ${EMAIL_BOOKMARKS.OPPORTUNITY_TITLE}`,
      },
    ];
    for (const template of updatedTemplates) {
      await queryRunner.query(
        `UPDATE public.default_email_template
          SET "name" = '${template.updatedName}', "subject" = '${template.subject}', "body" = '${template.body}'
          WHERE "name" = '${template.name}'`,
        undefined,
      );

      await queryRunner.query(
        `UPDATE public.email_template
          SET "name" = '${template.updatedName}', "subject" = '${template.subject}', "body" = '${template.body}'
          WHERE "name" = '${template.name}'`,
        undefined,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const oldTemplates = [
      {
        name: 'Post',
        updatedName: 'Post an Opportunity',
        subject: '{{FirstName}} posted {{entityName}} {{entityTitle}}',
        body: '{{FirstName}} posted {{entityName}} {{entityTitle}}',
      },
      {
        name: 'Edit',
        updatedName: 'Edit an Opportunity',
        subject: '{{FirstName}} edited {{entityName}} {{entityTitle}}',
        body: '{{FirstName}} edited {{entityName}} {{entityTitle}}',
      },
      {
        name: 'Follow',
        updatedName: 'Follow an Opportunity',
        subject: '{{FirstName}} followed your {{entityName}} {{entityTitle}}',
        body: '{{FirstName}} followed your {{entityName}} {{entityTitle}}',
      },
      {
        name: 'Upvote',
        updatedName: 'Upvote an Opportunity',
        subject: '{{FirstName}} upvoted your {{entityName}} {{entityTitle}}',
        body: '{{FirstName}} upvoted your {{entityName}} {{entityTitle}}',
      },
      {
        name: 'Comment',
        updatedName: 'Comment on an Opportunity',
        subject: '{{FirstName}} commented on {{entityName}} {{entityTitle}}',
        body: '{{FirstName}} commented on {{entityName}} {{entityTitle}}',
      },
    ];
    for (const template of oldTemplates) {
      await queryRunner.query(
        `UPDATE public.default_email_template
          SET "name" = '${template.name}', "subject" = '${template.subject}', "body" = '${template.body}'
          WHERE "name" = '${template.updatedName}'`,
        undefined,
      );

      await queryRunner.query(
        `UPDATE public.email_template
          SET "name" = '${template.name}', "subject" = '${template.subject}', "body" = '${template.body}'
          WHERE "name" = '${template.updatedName}'`,
        undefined,
      );
    }
  }
}
