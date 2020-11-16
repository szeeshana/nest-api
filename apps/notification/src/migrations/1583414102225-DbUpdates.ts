import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1583414102225 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "aggregated_id" uuid`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "aggregated_id"`,
      undefined,
    );
  }
}
