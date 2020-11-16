import { MigrationInterface, QueryRunner } from 'typeorm';
import { TABLES } from '../common/constants/constants';

export class UpdateEmailTemplateIds1598458716694 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const dataDefTemplates = await queryRunner.query(
      `select *  from public.${TABLES.DEFAULT_EMAIL_TEMPLATE} where action_type_id IN (2,3)`,
    );
    const communityEmailTemplates = await queryRunner.query(
      `select *  from public.${TABLES.EMAIL_TEMPLATE} where action_type_id IN (2,3)`,
    );
    const updateArr = [];
    dataDefTemplates.forEach(val => {
      if (val['action_type_id'] == 2) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.DEFAULT_EMAIL_TEMPLATE} set action_type_id = 3 where id = ${val['id']}`,
          ),
        );
      }
      if (val['action_type_id'] == 3) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.DEFAULT_EMAIL_TEMPLATE} set action_type_id = 2 where id = ${val['id']}`,
          ),
        );
      }
    });
    communityEmailTemplates.forEach(val => {
      if (val['action_type_id'] == 2) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.EMAIL_TEMPLATE} set action_type_id = 3 where id = ${val['id']}`,
          ),
        );
      }
      if (val['action_type_id'] == 3) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.EMAIL_TEMPLATE} set action_type_id = 2 where id = ${val['id']}`,
          ),
        );
      }
    });
    await Promise.all(updateArr);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const dataDefTemplates = await queryRunner.query(
      `select *  from public.${TABLES.DEFAULT_EMAIL_TEMPLATE} where action_type_id IN (2,3)`,
    );
    const communityEmailTemplates = await queryRunner.query(
      `select *  from public.${TABLES.EMAIL_TEMPLATE} where action_type_id IN (2,3)`,
    );
    const updateArr = [];
    dataDefTemplates.forEach(val => {
      if (val['action_type_id'] == 2) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.DEFAULT_EMAIL_TEMPLATE} set action_type_id = 3 where id = ${val['id']}`,
          ),
        );
      }
      if (val['action_type_id'] == 3) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.DEFAULT_EMAIL_TEMPLATE} set action_type_id = 2 where id = ${val['id']}`,
          ),
        );
      }
    });
    communityEmailTemplates.forEach(val => {
      if (val['action_type_id'] == 2) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.EMAIL_TEMPLATE} set action_type_id = 3 where id = ${val['id']}`,
          ),
        );
      }
      if (val['action_type_id'] == 3) {
        updateArr.push(
          queryRunner.query(
            `update public.${TABLES.EMAIL_TEMPLATE} set action_type_id = 2 where id = ${val['id']}`,
          ),
        );
      }
    });
    await Promise.all(updateArr);
  }
}
