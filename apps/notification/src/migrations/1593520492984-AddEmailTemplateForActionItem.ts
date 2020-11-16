import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailTemplateForActinItem1593520492984
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const genericDataforEmail = {
      cronName: 'Action Items Log',
      senderName: 'demoTestApp Notifications',
      senderEmail: 'support@demoTestApp.com',
      subjectLine: 'You have been assigned to complete new tasks on Ideas',
      body: `You have been assigned to complete new tasks on Ideas, which means ideas on {{communityName}} needs your help.Complete these tasks as soon as possible to help keep moving ideas forward!`,
      frequency: 1,
      timeZone: 'Asia/Karachi',
      runAt: '',
      nextRun: '',
      lastRun: '',
      actionType: '',
      footerSection: 'Footer text here',
    };
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
      // actionType: o.id,
      footerSection: genericDataforEmail.footerSection,
    };
    const bulkInsertData = `(DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, '${tempObject.name}', '${tempObject.subject}', '${tempObject.body}', '${tempObject.featureImage}', '${tempObject.footerSection}', '${tempObject.frequency}', '${tempObject.timeZone}', '${tempObject.runAt}', '${tempObject.nextRun}', '${tempObject.lastRun}', '${tempObject.senderName}', '${tempObject.senderEmail}')`;
    await queryRunner.query(
      `INSERT INTO "default_email_template"("created_at", "updated_at", "is_deleted", "updated_by", "created_by", "name", "subject", "body", "feature_image", "footer_section", "frequency", "time_zone", "run_at", "next_run", "last_run", "sender_name", "sender_email") VALUES ${bulkInsertData}`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `delete from public.default_email_template where name='Action Items Log'`,
      undefined,
    );
  }
}
