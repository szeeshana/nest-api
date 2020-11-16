import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1598529613279 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "community_name" character varying(250)`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "community_name"`,
      undefined,
    );
  }
}
