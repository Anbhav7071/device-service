import { MigrationInterface, QueryRunner } from 'typeorm';
import fs from 'fs';

export class Defaults3313472580000 implements MigrationInterface {
  name = 'Defaults3313472580002';
  public async up(queryRunner: QueryRunner): Promise<any> {
    console.log('Running Life-End queries');
    console.log(process.cwd());
    const triggerQuery = fs.readFileSync(
      'src/database/migrations/defaults/triggers.sql',
      'utf-8',
    );
    await queryRunner.query(triggerQuery);
    queryRunner.afterMigration = async () => {
      await console.log('LIFE END - all migrations ran!');
    };
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await console.log('query runner for rollback:', queryRunner);
  }
}
