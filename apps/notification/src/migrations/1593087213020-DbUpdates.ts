import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1593087213020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "action_item_log" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean, "updated_by" character varying(100), "created_by" character varying(100), "action_item_id" integer NOT NULL, "action_item_title" character varying(250) NOT NULL, "ip" text, "user_id" integer NOT NULL, "user_name" character varying(250) NOT NULL, "user_email" character varying(250) NOT NULL, "entity_object_id" integer NOT NULL, "entity_type_id" integer NOT NULL, "entity_name" character varying(250) NOT NULL, "entity_title" text, "entity_description" text, "entity_operend_object" text, "is_read" smallint NOT NULL DEFAULT 0, "is_email_created" smallint NOT NULL DEFAULT 0, "aggregated_id" text, "is_email" boolean NOT NULL DEFAULT true, "community" integer NOT NULL, CONSTRAINT "PK_b3bebd278b7a386e57dd489ddbf" PRIMARY KEY ("id"))`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "action_item_log"`, undefined);
  }
}
