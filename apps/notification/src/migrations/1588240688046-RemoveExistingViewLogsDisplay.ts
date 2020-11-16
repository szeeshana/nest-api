import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveExistingViewLogsDisplay1588240688046
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.activity_log
        SET is_notification = false, is_activity = false, create_email = 0
        WHERE action_type_id = (
          SELECT id FROM public.action_type
          WHERE abbreviation = 'view'
        )`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.activity_log
        SET is_notification = true, is_activity = true
        WHERE action_type_id = (
          SELECT id FROM public.action_type
          WHERE abbreviation = 'view'
        )`,
      undefined,
    );
  }
}
