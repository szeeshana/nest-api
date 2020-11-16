import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1582871803841 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "community" integer NOT NULL`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "community"`,
      undefined,
    );
  }
}
