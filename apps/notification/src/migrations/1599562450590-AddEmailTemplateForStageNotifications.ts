import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailTemplateForStageNotifications1599562450590
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    // Creating Workflow/Stage notifications related templates data.
    const genericStageEmailTemp = {
      featureImage:
        'https://demoTestApp-test.s3.us-east-2.amazonaws.com/assets/emails/email_banner.png',
      senderName: 'demoTestApp Notifications',
      senderEmail: 'support@demoTestApp.com',
      frequency: 1,
      timeZone: 'Asia/Karachi',
      runAt: '',
      nextRun: '',
      lastRun: '',
      footerSection: `This is an auto generated email. Please don''t reply it. In case of query, talk with your administrator.`,
    };
    const templates = [
      {
        ...genericStageEmailTemp,
        name: 'Add Workflow to an Opportunity',
        subject: `A workflow has been added to {{opportunityTitle}}!`,
        body: `<p><strong>#{{opportunityNumber}} {{opportunityTitle}} has been added to the workflow {{currentWorkflowTitle}} &gt; {{currentStageTitle}}.</strong></p><br />
        <p><span style="font-weight: 400;">{{customMessage}}</span></p><br />
        <p><span style="font-weight: 400;">Here&rsquo;s what&rsquo;s happening next - {{currentStageDescription}}</span></p>`,
        actionType: 20,
      },
      {
        ...genericStageEmailTemp,
        name: 'Change Workflow of an Opportunity',
        subject: `{{opportunityTitle}}''s Workflow has been changed!`,
        body: `<p><strong>#{{opportunityNumber}} {{opportunityTitle}} has moved from workflow {{previousWorkflowTitle}} to workflow {{currentWorkflowTitle}}.</strong></p><br />
        <p><span style="font-weight: 400;">{{customMessage}}</span></p><br />
        <p><span style="font-weight: 400;">Here&rsquo;s what&rsquo;s happening next - {{currentStageDescription}}</span></p>`,
        actionType: 21,
      },
      {
        ...genericStageEmailTemp,
        name: 'Change Stage of an Opportunity',
        subject: `{{opportunityTitle}}''s Stage has been changed!`,
        body: `<p><strong>#{{opportunityNumber}} {{opportunityTitle}} has moved from {{previousStageTitle}} to {{currentStageTitle}}.</strong></p><br />
        <p><span style="font-weight: 400;">{{customMessage}}</span></p><br />
        <p><span style="font-weight: 400;">Here&rsquo;s what&rsquo;s happening next - {{currentStageDescription}}</span></p>`,
        actionType: 22,
      },
    ];

    // Creating Values query string for Default Email Templates.
    let defaultTempsValues = '';
    templates.forEach((template, index) => {
      defaultTempsValues += `${index ? ', ' : ''}(false, '${template.name}',
        '${template.subject}', '${template.body}', '${template.featureImage}',
        '${template.footerSection}', '${template.frequency}',
        '${template.timeZone}', '${template.runAt}', '${template.nextRun}',
        '${template.lastRun}', '${template.senderName}',
        '${template.senderEmail}', ${template.actionType})`;
    });

    // Creating Values query string for Existing Communities' Email Templates.
    const communities = await queryRunner.query(
      `SELECT DISTINCT community FROM public.email_template;`,
    );

    let communityTempsValues = '';
    communities.forEach((comm, index) => {
      templates.forEach((template, tempIndex) => {
        communityTempsValues += `${index || tempIndex ? ', ' : ''}(false,
          '${template.name}', '${template.subject}', '${template.body}',
          '${template.featureImage}', '${template.footerSection}',
          '${template.frequency}', '${template.timeZone}', '${template.runAt}',
          '${template.nextRun}', '${template.lastRun}',
          '${template.senderName}', '${template.senderEmail}',
          ${template.actionType}, ${comm.community})`;
      });
    });

    // Inserting the tempaltes in DB.
    await queryRunner.query(
      `INSERT INTO "default_email_template"("is_deleted", "name", "subject",
        "body", "feature_image", "footer_section", "frequency", "time_zone",
        "run_at", "next_run", "last_run", "sender_name", "sender_email",
        "action_type_id")
        VALUES ${defaultTempsValues}`,
      undefined,
    );
    if (communities.length) {
      await queryRunner.query(
        `INSERT INTO "email_template"("is_deleted", "name", "subject",
        "body", "feature_image", "footer_section", "frequency", "time_zone",
        "run_at", "next_run", "last_run", "sender_name", "sender_email",
        "action_type_id", "community")
        VALUES ${communityTempsValues}`,
        undefined,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DELETE FROM public.default_email_template
        WHERE name='Add Workflow to an Opportunity'
          OR name='Change Workflow of an Opportunity'
          OR name='Change Stage of an Opportunity'`,
      undefined,
    );
    await queryRunner.query(
      `DELETE FROM public.email_template
        WHERE name='Add Workflow to an Opportunity'
          OR name='Change Workflow of an Opportunity'
          OR name='Change Stage of an Opportunity'`,
      undefined,
    );
  }
}
