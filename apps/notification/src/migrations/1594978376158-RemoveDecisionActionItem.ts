import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDecisionActionItem1594978376158
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `UPDATE public.action_item_log
        SET action_item_title='Scorecard'
        WHERE action_item_title='Decision / Question / Poll';`,
      undefined,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<any> {
    // There's no going back!
  }
}
