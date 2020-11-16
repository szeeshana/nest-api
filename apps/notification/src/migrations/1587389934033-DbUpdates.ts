import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1587389934033 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "is_notification" boolean NOT NULL DEFAULT true`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "is_activity" boolean NOT NULL DEFAULT true`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "is_activity"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "is_notification"`,
      undefined,
    );
  }
}
