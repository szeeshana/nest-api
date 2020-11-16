import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1582801226008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "action_type" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean, "updated_by" character varying(100), "created_by" character varying(100), "name" character varying(250) NOT NULL, "abbreviation" character varying(250) NOT NULL, CONSTRAINT "UQ_51595da4c6d8dfb095403091a18" UNIQUE ("name"), CONSTRAINT "UQ_6ff2a1f321004ed72f00752f800" UNIQUE ("abbreviation"), CONSTRAINT "PK_d1c2e72ba9b5780623b78dde3f5" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "activity_log" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean, "updated_by" character varying(100), "created_by" character varying(100), "ip" text, "user_id" integer NOT NULL, "user_name" character varying(250) NOT NULL, "user_email" character varying(250) NOT NULL, "entity_object_id" integer NOT NULL, "entity_id" integer NOT NULL, "entity_name" integer NOT NULL, "entity_title" text, "entity_description" text, "action_type_id" integer, CONSTRAINT "PK_067d761e2956b77b14e534fd6f1" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "email_template" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean, "updated_by" character varying(100), "created_by" character varying(100), "name" character varying(250) NOT NULL, "subject" character varying(250) NOT NULL, "body" text NOT NULL, "description" character varying(2000), "agenda_tag" text, "sender_name" character varying(250) NOT NULL, "sender_email" character varying(200) NOT NULL, CONSTRAINT "PK_c90815fd4ca9119f19462207710" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD CONSTRAINT "FK_b551133881d66f74046534e911a" FOREIGN KEY ("action_type_id") REFERENCES "action_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP CONSTRAINT "FK_b551133881d66f74046534e911a"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "email_template"`, undefined);
    await queryRunner.query(`DROP TABLE "activity_log"`, undefined);
    await queryRunner.query(`DROP TABLE "action_type"`, undefined);
  }
}
