import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1582876070336 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "actor_user_id" integer NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "actor_user_name" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "actor_user_email" character varying(250) NOT NULL`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "actor_user_email"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "actor_user_name"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "actor_user_id"`,
      undefined,
    );
  }
}
