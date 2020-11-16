import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDefaultEmailBGImage1588072518912
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.default_email_template
            SET feature_image = 'https://demoTestApp-test.s3.us-east-2.amazonaws.com/assets/media/FeaturedBgImage.png'`,
      undefined,
    );

    await queryRunner.query(
      `UPDATE public.email_template
            SET feature_image = 'https://demoTestApp-test.s3.us-east-2.amazonaws.com/assets/media/FeaturedBgImage.png'`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.default_email_template
            SET feature_image = 'https://demoTestApp-test.s3.us-east-2.amazonaws.com/assets/emails/email_banner.png'`,
      undefined,
    );

    await queryRunner.query(
      `UPDATE public.email_template
            SET feature_image = 'https://demoTestApp-test.s3.us-east-2.amazonaws.com/assets/emails/email_banner.png'`,
      undefined,
    );
  }
}
