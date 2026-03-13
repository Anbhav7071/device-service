import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';

import { DeviceRegistryModule } from './modules/device-registry/device-registry.module';
import { DeviceAssignmentModule } from './modules/device-assignment/device-assignment.module';
import { DeviceConfigModule } from './modules/device-config/device-config.module';
import { DeviceCredentialModule } from './modules/device-credential/device-credential.module';

import { DeviceConnectivityModule } from './modules/device-connectivity/device-connectivity.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    DeviceRegistryModule,
    DeviceAssignmentModule,
    DeviceConfigModule,
    DeviceCredentialModule,
    DeviceConnectivityModule,
    AuthModule,
  ],
})
export class AppModule { }
