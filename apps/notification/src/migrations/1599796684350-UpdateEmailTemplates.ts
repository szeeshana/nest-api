import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmailTemplates1599796684350 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.default_email_template
              SET subject='You have Been Invite to Ideate with {{companyName}}',body='Dear {{companyName}} Team Member,
              <br></br>
              We believe that all our employees have great ideas, and that those ideas need to be heard. <br></br>
              That is why we are inviting you to participate in innovation challenges, powered by demoTestApp. Post your ideas on ways to improve {{companyName}} for real time recognition from your peers and managers, or comment and vote on the ideas you support to determine which we should bring to life!
              <br>
              '
              WHERE action_type_id=18;`,
      undefined,
    );
    await queryRunner.query(
      `UPDATE public.default_email_template
              SET subject='You have Been Invite to Ideate with {{companyName}}',body='Dear {{companyName}} Team Member,
              <br></br>
              We believe that all our employees have great ideas, and that those ideas need to be heard. <br></br>
              That is why we are inviting you to participate in innovation challenges, powered by demoTestApp. Post your ideas on ways to improve {{companyName}} for real time recognition from your peers and managers, or comment and vote on the ideas you support to determine which we should bring to life!
              <br>
              '
              WHERE action_type_id=18;`,
      undefined,
    );
    await queryRunner.query(
      `UPDATE public.default_email_template
              SET body='<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                                      <td align="left" valign="top" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#575858; line-height:24px;">
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
              '
              WHERE name='Default Email Template';`,
      undefined,
    );
    await queryRunner.query(
      `UPDATE public.email_template
              SET body='<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                                      <td align="left" valign="top" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#575858; line-height:24px;">
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
              '
              WHERE name='Default Email Template';`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.default_email_template
              SET subject='You have Been Invite to Ideate with {{companyName}}',body='Dear {{companyName}} Team Member,
              <br></br>
              We believe that all our employees have great ideas, and that those ideas need to be heard. <br></br>
              That is why we are inviting you to participate in innovation challenges, powered by demoTestApp. Post your ideas on ways to improve {{companyName}} for real time recognition from your peers and managers, or comment and vote on the ideas you support to determine which we should bring to life!
              <br>
              '
              WHERE action_type_id=18;`,
      undefined,
    );
    await queryRunner.query(
      `UPDATE public.default_email_template
              SET subject='You have Been Invite to Ideate with {{companyName}}',body='Dear {{companyName}} Team Member,
              <br></br>
              We believe that all our employees have great ideas, and that those ideas need to be heard. <br></br>
              That is why we are inviting you to participate in innovation challenges, powered by demoTestApp. Post your ideas on ways to improve {{companyName}} for real time recognition from your peers and managers, or comment and vote on the ideas you support to determine which we should bring to life!
              <br>
              '
              WHERE action_type_id=18;`,
      undefined,
    );
  }
}
