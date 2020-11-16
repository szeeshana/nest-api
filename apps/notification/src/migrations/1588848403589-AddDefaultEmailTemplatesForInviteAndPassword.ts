import { MigrationInterface, QueryRunner } from 'typeorm';
import * as _ from 'lodash';

export class AddDefaultEmailTemplatesForInviteAndPassword1588848403589
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const genericDataforEmail = {
      senderName: 'demoTestApp',
      senderEmail: 'support@demoTestApp.com',
      subjectLine:
        '{{FirstName}} (Anonymous) mentioned you in their submission of {{ideaname}}',
      body: `{{FirstName}} (Anonymous) mentioned you in their idea submission
                  {{ideaNumber}} {{ideaTitle}}
                  {{ideaDescription}}`,
      frequency: 1,
      timeZone: 'America/New_York',
      runAt: '',
      nextRun: '',
      lastRun: '',
      actionType: '',
      footerSection: 'Footer text here',
    };
    const entityTypeDataInvite = await queryRunner.query(
      `select * from public.action_type where name = 'InviteUser'`,
      undefined,
    );
    const entityTypeDataForgot = await queryRunner.query(
      `select * from public.action_type where name = 'ForgotPassword'`,
      undefined,
    );

    const tempObject = {
      featureImage:
        'https://demoTestApp-test.s3.us-east-2.amazonaws.com/assets/media/FeaturedBgImage.png',
      senderName: genericDataforEmail.senderName,
      senderEmail: genericDataforEmail.senderEmail,
      subject: genericDataforEmail.subjectLine,
      body: genericDataforEmail.body,
      frequency: genericDataforEmail.frequency,
      timeZone: genericDataforEmail.timeZone,
      runAt: genericDataforEmail.runAt,
      nextRun: genericDataforEmail.lastRun,
      lastRun: genericDataforEmail.lastRun,
      actionType: '',
      footerSection: genericDataforEmail.footerSection,
    };
    let bulkInsertData = '';

    bulkInsertData =
      bulkInsertData +
      `(DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, 'Invite User', 'User Invitation', 'You have been invited to
        innovate with {{companyName}}.
        Dear Team Member,
        We believe you have great ideas and that those ideas have the potential to transform the future of health care. {{linkButton}}', '${tempObject.featureImage}', 'You are receiving this message because {{companyName}} believes you have ideas to help positively impact your organization’s future.
        You can unsubscribe to this email by updating your email preferences or this link.', '${tempObject.frequency}', '${tempObject.timeZone}', '${tempObject.runAt}', '${tempObject.nextRun}', '${tempObject.lastRun}', '${tempObject.senderName}', '${tempObject.senderEmail}', '${entityTypeDataInvite[0].id}'),`;
    bulkInsertData =

    bulkInsertData =
      bulkInsertData +
      `(DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, 'Default Email Template', 'Default Email Template', '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <title>{{ subject }}</title>
      <style type="text/css">
        .ReadMsgBody {width: 100%; background-color: #ffffff;}
        .ExternalClass {width: 100%; background-color: #ffffff;}
        body {width: 100%; background-color: #FFFFFF; margin:0; padding:0; -webkit-font-smoothing: antialiased;font-family: Arial, Helvetica, sans-serif;}
        table {border-collapse: collapses;}

        @media only screen and (max-width: 640px)  {
            body[yahoo] .deviceWidth {width:100%!important; padding:0;}
            body[yahoo] .center {text-align: center!important;}
            td.img_Rs img {width:100%!important;max-width: 100%!important;margin: auto;}
          }

        @media only screen and (max-width: 479px) {
            body[yahoo] .deviceWidth {width:100%!important; padding:0;}
            body[yahoo] .center {text-align: center!important;}
            td.img_Rs img {width:100%!important;max-width: 100%!important;margin: auto;}
          }

      </style>
      </head>

      <body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix" style="font-family: Georgia, Times, serif">
        <!-- Wrapper -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
          <tr>
            <td width="100%" valign="top" bgcolor="#F8F8F8" style="padding:10px 10px;">
              <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                <tr>
                  <td align="center" valign="top">
                    <!-- Start Body-->
                    <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                      <tr>
                        <td align="center" valign="top" style="padding:10px 0px;">
                        <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                          <tr>
                            <td align="left" valign="top" style="padding:15px 0px 5px 0px;">
                              {{tagLine}}
                            </td>
                          </tr>
                        </table>
                        </td>
                      </tr>
                    </table><!-- End Body -->
                  </td>
                </tr>
              </table>
              <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                <tr>
                  <td align="center" valign="top" style="border:1px solid #DEDEDE; border-radius:3px;">
                    <!-- Start Body-->
                    <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                      <tr>
                        <td bgcolor="#FFFFFF" align="center" valign="top" style="padding:10px 10px;">
                          <table width="600" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                              <tr>
                                <td align="center" valign="top" style="padding:0px 0px 15px 0px;">
                                  <img align="center" src="{{featureImage}}" width="600" style="max-width:717px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage">
                                </td>
                              </tr>

                              <tr>
                              <td align="left" valign="top" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#575858; line-height:24px; padding:10px 0px;">
                                {{body}}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table><!-- End Body -->
                    <table>
                      <tr>
                        <td bgcolor="#F8F8F8" align="center" align="top" style="font-size:14px; color:#575858; line-height:24px; padding:15px 0px 10px 0px; margin: 0;">Having trouble accessing demoTestApp? We are here to help!
                          <a style="text-decoration:underline; color: {{ primaryColor }};" href="mailto:support@demoTestApp.com">Contact Support</a>.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center" bgcolor="#FFFFFF">
              <tr>
                <td align="center" valign="top">
                  <!-- Start Body-->
                  <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                    <tr>
                      <td align="center" valign="top" style="padding:5px 0px 10px 0px;">
                        <table width="650" border="0" cellspacing="0" cellpadding="0" class="deviceWidth" align="center">
                          <tr>
                            <td align="left" valign="top" style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#575858; line-height:20px; padding:6px 0px;">
                              You are receiving this message because {{companyName}} believes you have ideas to help positively impact your organization’s future.
                            </td>
                          </tr>
                          <tr>
                          </tr>
                            <tr>
                              <td align="left" valign="top" style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#575858; line-height:20px; padding:6px 0px;">
                                You can unsubscribe to this email by updating your email preferences or <a href="{{unsubscribeLink}}">this link</a>.</td>
                              </td>
                            </tr>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table><!-- End Body -->
                </td>
              </tr>
            </table>
          </tr>
        </table><!-- End Wrapper -->
      </body>
      </html>
      ', '${tempObject.featureImage}', '', '${tempObject.frequency}', '${tempObject.timeZone}', '${tempObject.runAt}', '${tempObject.nextRun}', '${tempObject.lastRun}', '${tempObject.senderName}', '${tempObject.senderEmail}', null),`;
    bulkInsertData = bulkInsertData.replace(/,\s*$/, '');

    await queryRunner.query(
      `INSERT INTO "default_email_template"("created_at", "updated_at", "is_deleted", "updated_by", "created_by", "name", "subject", "body", "feature_image", "footer_section", "frequency", "time_zone", "run_at", "next_run", "last_run", "sender_name", "sender_email", "action_type_id") VALUES ${bulkInsertData}`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `delete from public.default_email_template where name='Invite User'`,
      undefined,
    );
    await queryRunner.query(
      `delete from public.default_email_template where name='Forgot Password'`,
      undefined,
    );
    await queryRunner.query(
      `delete from public.default_email_template where name='Default Email Template'`,
      undefined,
    );
  }
}
