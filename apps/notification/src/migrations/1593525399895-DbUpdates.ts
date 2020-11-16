import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1593525399895 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "action_item_abbreviation" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "action_due_date" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "entity_image_url" text`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "entity_image_url"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "action_due_date"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "action_item_abbreviation"`,
      undefined,
    );
  }
}
