import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbUpdates1589981827295 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TYPE "stage_email_setting_email_type_enum" AS ENUM('notification', 'assignee')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "stage_email_setting" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean, "updated_by" character varying(100), "created_by" character varying(100), "email_type" "stage_email_setting_email_type_enum" NOT NULL, "entity_type" integer NOT NULL, "entity_object_id" integer NOT NULL, "user_id" integer NOT NULL, "user_email" character varying(250) NOT NULL, "reminder_frequency" integer, "time_zone" character varying(250) NOT NULL, "next_run" character varying(250), "last_run" character varying(250), "community" integer NOT NULL, "action_type_id" integer, CONSTRAINT "PK_d3f32d873baf9b58c99a8589ec5" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "stage_email_setting" ADD CONSTRAINT "FK_b8bec463f54cb7b9c90c1c91e38" FOREIGN KEY ("action_type_id") REFERENCES "action_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "stage_email_setting" DROP CONSTRAINT "FK_b8bec463f54cb7b9c90c1c91e38"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "stage_email_setting"`, undefined);
    await queryRunner.query(
      `DROP TYPE "stage_email_setting_email_type_enum"`,
      undefined,
    );
  }
}
