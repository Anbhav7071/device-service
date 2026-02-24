import { MigrationInterface, QueryRunner } from 'typeorm';

export class Defaults1577817000000 implements MigrationInterface {
  name = 'Defaults1577817000000';
  RAW_QUERIES = [
    'CREATE EXTENSION IF NOT EXISTS "ltree"',
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
  ];

  public async up(queryRunner: QueryRunner): Promise<any> {
    console.log('Running Life-Start queries');
    for (const ind in this.RAW_QUERIES) {
      const query = this.RAW_QUERIES[ind];
      console.log('running query!', query);
      const qr = await queryRunner.query(query);
      console.log('query: ', query, 'Response: ', qr);
    }

    queryRunner.afterMigration = async () => {
      await console.log('LIFE_START: all migrations ran!');
    };
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await console.log('query runner for rollback:', queryRunner);
  }
}
