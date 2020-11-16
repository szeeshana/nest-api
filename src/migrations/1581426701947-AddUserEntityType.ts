import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEntityType1581426701947 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `INSERT INTO public.entity_type(
        name, abbreviation, entity_code)
        VALUES ('user', 'user', 'user');`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DELETE FROM public.entity_type where name = 'user';`,
      undefined,
    );
  }
}
