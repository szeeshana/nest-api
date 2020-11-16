import { MigrationInterface, QueryRunner } from 'typeorm';

export class ForgotEmailTemplateUpdates1599453169498
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.default_email_template
          SET subject='{{CommunityName}} - Changing Your Password',body='Hi {{firstName}},
          We have received a request to reset the password for your account. If you made this request, please click on button below to reset your password.
          <br>
          This request will work for 24 hours or until your password is reset. If you did not ask to change your password, please ignore this email and your account will remain unchanged.
          {{linkButton}}'
          WHERE id=12;`,
      undefined,
    );
    await queryRunner.query(
      `UPDATE public.email_template
          SET subject='{{CommunityName}} - Changing Your Password',body='Hi {{firstName}},
          We have received a request to reset the password for your account. If you made this request, please click on button below to reset your password.
          <br>
          This request will work for 24 hours or until your password is reset. If you did not ask to change your password, please ignore this email and your account will remain unchanged.
          {{linkButton}}'
          WHERE action_type_id=19;`,
      undefined,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.default_email_template
        SET subject='Forgot Password',body='Your forgot password link is {{linkButton}}'
        WHERE id=12;`,
      undefined,
    );
    await queryRunner.query(
      `UPDATE public.email_template
        SET subject='Forgot Password',body='Your forgot password link is {{linkButton}}'
        WHERE action_type_id=19;`,
      undefined,
    );
  }
}
