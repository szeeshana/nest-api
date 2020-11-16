import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1588935429872 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "is_email" boolean NOT NULL DEFAULT true`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "is_email"`,
      undefined,
    );
  }
}
