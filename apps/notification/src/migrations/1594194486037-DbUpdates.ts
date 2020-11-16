import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1594194486037 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "send_email" ADD "subject" text`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "send_email" DROP COLUMN "subject"`,
      undefined,
    );
  }
}
