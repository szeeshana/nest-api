import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentEntityType1581426778194 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `INSERT INTO public.entity_type(
          name, abbreviation, entity_code)
          VALUES ('comment', 'comment', 'comment');`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `DELETE FROM public.entity_type where name = 'comment';`,
      undefined,
    );
  }
}
