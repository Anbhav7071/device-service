import { NestFactory } from '@nestjs/core';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeedModule } from './seeds/seed.module';
import { TypeOrmConfigService } from './typeorm-config.service';
import dotenv from 'dotenv';

// Ensure env vars are loaded when invoked by TypeORM CLI
dotenv.config();

// Polyfill global crypto for libraries expecting Web Crypto in CLI context
// (Some environments during ts-node/TypeORM CLI may not expose globalThis.crypto)
if (!(global as any).crypto) {
  try {
    const { webcrypto } = require('crypto');
    (global as any).crypto = webcrypto;
  } catch (_) {
    // noop: if not available, let runtime throw a clearer error later
  }
}

const createDataSource = async () => {
  const app = await NestFactory.create(SeedModule);
  const service = await app.get(TypeOrmConfigService);

  const dataSource = new DataSource(
    service.createTypeOrmOptions() as DataSourceOptions,
  );

  await app.close();

  return dataSource;
};

export const AppDataSource = createDataSource();
