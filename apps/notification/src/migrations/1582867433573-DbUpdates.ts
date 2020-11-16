import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1582867433573 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "entity_name"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "entity_name" character varying(250) NOT NULL`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "entity_name"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "entity_name" integer NOT NULL`,
      undefined,
    );
  }
}
