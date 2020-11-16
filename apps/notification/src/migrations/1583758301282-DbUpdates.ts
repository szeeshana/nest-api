import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1583758301282 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "run_at"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "run_at" text`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "run_at"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "run_at" character varying(250) NOT NULL`,
      undefined,
    );
  }
}
