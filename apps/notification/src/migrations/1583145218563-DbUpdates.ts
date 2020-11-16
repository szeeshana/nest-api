import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1583145218563 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "is_read" smallint NOT NULL DEFAULT 0`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "is_read"`,
      undefined,
    );
  }
}
