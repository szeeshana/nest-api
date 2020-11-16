import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1594064183465 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "community_name" character varying(250)`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" ADD "url" text`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "url"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "action_item_log" DROP COLUMN "community_name"`,
      undefined,
    );
  }
}
