import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1593979930864 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "stage_email_setting" ADD "is_completed" smallint NOT NULL DEFAULT 0`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "stage_email_setting" DROP COLUMN "is_completed"`,
      undefined,
    );
  }
}
