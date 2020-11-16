import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanEmailTemplates1588072817197 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DELETE FROM public.default_email_template
        WHERE "name" = 'Mention User on an Idea';`,
      undefined,
    );

    await queryRunner.query(
      `DELETE FROM public.email_template
        WHERE "name" = 'Mention User on an Idea';`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(``, undefined);
  }
}
