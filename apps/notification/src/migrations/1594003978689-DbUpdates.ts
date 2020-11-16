import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1594003978689 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `TRUNCATE public."stage_email_setting";`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "stage_email_setting" ADD "stage_id" integer NOT NULL`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "stage_email_setting" DROP COLUMN "stage_id"`,
      undefined,
    );
  }
}
