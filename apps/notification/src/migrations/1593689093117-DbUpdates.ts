import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1593689093117 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "entity_name"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "entity_type_name" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "is_log" boolean NOT NULL DEFAULT true`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "is_notification" boolean NOT NULL DEFAULT true`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "action_due_date"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "action_due_date" TIMESTAMP WITH TIME ZONE`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "is_read"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "is_read" boolean NOT NULL DEFAULT false`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ALTER COLUMN "is_email" SET DEFAULT false`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ALTER COLUMN "is_email" SET DEFAULT true`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "is_read"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "is_read" smallint NOT NULL DEFAULT 0`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "action_due_date"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "action_due_date" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "is_notification"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "is_log"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "entity_type_name"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "entity_name" character varying(250) NOT NULL`,
      undefined,
    );
  }
}
