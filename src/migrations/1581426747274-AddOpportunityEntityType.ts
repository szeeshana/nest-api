import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpportunityEntityType1581426747274
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `INSERT INTO public.entity_type(
          name, abbreviation, entity_code)
          VALUES ('idea', 'idea', 'idea');`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DELETE FROM public.entity_type where name = 'idea';`,
      undefined,
    );
  }
}
