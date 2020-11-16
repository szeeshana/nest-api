import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateActivityLogsIsActivity1587391468391
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.activity_log
        SET is_activity=false
        WHERE entity_operend_object NOTNULL`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.activity_log
        SET is_activity=true
        WHERE entity_operend_object NOTNULL`,
      undefined,
    );
  }
}
