import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1583329349185 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "default_email_template" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean, "updated_by" character varying(100), "created_by" character varying(100), "name" character varying(250) NOT NULL, "subject" character varying(250) NOT NULL, "body" text NOT NULL, "feature_image" text NOT NULL, "footer_section" text NOT NULL, "frequency" bigint NOT NULL, "time_zone" character varying(250) NOT NULL, "run_at" character varying(250) NOT NULL, "next_run" character varying(250) NOT NULL, "last_run" character varying(250) NOT NULL, "sender_name" character varying(250) NOT NULL, "sender_email" character varying(200) NOT NULL, "action_type_id" integer, CONSTRAINT "PK_89e72b2998b04a3c4d17fbfd41b" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "send_email_status_enum" AS ENUM('pending', 'sent')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "send_email" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean, "updated_by" character varying(100), "created_by" character varying(100), "to" character varying(250) NOT NULL, "from" character varying(250) NOT NULL, "email_content" text NOT NULL, "status" "send_email_status_enum" NOT NULL DEFAULT 'pending', "community" integer NOT NULL, CONSTRAINT "PK_2802a7112d155706e528d674ec0" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "description"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "agenda_tag"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD "create_email" smallint NOT NULL DEFAULT 0`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "feature_image" text NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "footer_section" text NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "frequency" bigint NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "time_zone" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "run_at" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "next_run" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "last_run" character varying(250) NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "community" integer NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "action_type_id" integer`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "default_email_template" ADD CONSTRAINT "FK_2a38ee370e2e5c6de926e28c3e1" FOREIGN KEY ("action_type_id") REFERENCES "action_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD CONSTRAINT "FK_21467819c9390833ce02c3604fb" FOREIGN KEY ("action_type_id") REFERENCES "action_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP CONSTRAINT "FK_21467819c9390833ce02c3604fb"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "default_email_template" DROP CONSTRAINT "FK_2a38ee370e2e5c6de926e28c3e1"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "action_type_id"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "community"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "last_run"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "next_run"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "run_at"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "time_zone"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "frequency"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "footer_section"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" DROP COLUMN "feature_image"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP COLUMN "create_email"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "agenda_tag" text`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "email_template" ADD "description" character varying(2000)`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "send_email"`, undefined);
    await queryRunner.query(`DROP TYPE "send_email_status_enum"`, undefined);
    await queryRunner.query(`DROP TABLE "default_email_template"`, undefined);
  }
}
