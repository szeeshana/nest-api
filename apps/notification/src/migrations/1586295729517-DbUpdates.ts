import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1586295729517 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "entity_operend_object" text`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "entity_operend_object"`,
      undefined,
    );
  }
}
