import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNameTable1771579330788 implements MigrationInterface {
  name = 'CreateNameTable1771579330788';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role" ADD "assignable" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "assignable"`);
  }
}
