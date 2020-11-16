export const TABLES = {
  ACTIVITY_LOG: 'activity_log',
  EMAIL_TEMPLATE: 'email_template',
  ACTION_TYPE: 'action_type',
  SEND_EMAIL: 'send_email',
  DEFAULT_EMAIL_TEMPLATE: 'default_email_template',
  STAGE_EMAIL_SETTING: 'stage_email_setting',
  ACTION_ITEM_LOG: 'action_item_log',
};

export const BOOLEAN = {
  TRUE: 'true',
  FALSE: 'false',
};

export const EMAIL_BOOKMARKS = {
  FIRST_NAME: '{{firstName}}',
  OPPORTUNITY_NUMBER: '{{opportunityNumber}}',
  OPPORTUNITY_TITLE: '{{opportunityTitle}}',
  OPPORTUNITY_DESCRIPTION: '{{opportunityDescription}}',
};

export enum EMAIL_STATUSES {
  PENDING = 'pending',
  SENT = 'sent',
}
export const EMAIL_TEMPLATE = {
  header: `<!DOCTYPE html>
      <html>

      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <title>Whatstocks</title>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0;">`,
  footer: `</body>
      </html>`,
};

export const EMAIL_BODY = `<div id="wrapper" style="width: 100%;">
<table border="0" cellpadding="0" cellspacing="0" style="width:100%; font-family:  Open Sans ,
      sans-serif;font-size:16px;margin:0 auto;line-height:21px; padding: 25px;">
  <tbody>
    <tr>
      <td align="left" style="color:#455a64;padding:20px 36px 15px">
        <!-- subject -->
        <!-- <h1 style="line-height:28px;font-size:24px; margin: 0; color: #1ab394;font-weight: 400; font-family:
          Montserrat, sans-serif;">You"ve been invited to<br /> innovate with OSF Trailblazer </h1> -->
      </td>
    </tr>
    <tr>
      <!-- body Text -->
      <td align="left" style="color:#455a64;padding:10px 36px 15px">
        <p style="margin: 0; white-space: pre-wrap;">{{body}}</p>
      </td>
    </tr>
    <tr>
      <!-- featured Image -->
      <td align="left" style="color:#455a64;padding:15px 23px 15px">
        <img src="{{featureImage}}" width="100%" style="display: block;">
      </td>
    </tr>
    <tr>
      <!-- footer Text -->
      <td align="left" style="color:#455a64;padding:20px 36px 15px">
        <p style="margin: 0;  white-space: pre-wrap;">{{footer}}</p>
      </td>
    </tr>
    <tr>
      <td align="left" style="padding:25px 36px 15px; border-top: 1px dashed #cfcfcf;">
        <p style="margin: 0 0 10px; font-size: 14px; color: #707070;">Having trouble accessing <a href="#"
            style="color: #1ab394; text-decoration: underline;">demoTestApp?</a></p>
        <p style="margin: 0; font-size: 12px; color: #707070;">Powered by demoTestApp. 1245 North Water Street,
          Floor 2
      </td>
    </tr>
  </tbody>
</table>
</div>`;
