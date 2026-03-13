import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceRegistryService } from './device-registry.service';
import { DeviceRegistryController } from './device-registry.controller';
import { DeviceRegistryEntity } from './entities/device-registry.entity';
import { DeviceConnectivityEntity } from '../device-connectivity/entities/device-connectivity.entity';
import { DeviceRegistrationOrchestrator } from './device-registration.orchestrator';
import { DeviceConfigModule } from '../device-config/device-config.module';

import { DeviceAssignmentModule } from '../device-assignment/device-assignment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceRegistryEntity, DeviceConnectivityEntity]),
    DeviceConfigModule,

    DeviceAssignmentModule,
  ],
  controllers: [DeviceRegistryController],
  providers: [DeviceRegistryService, DeviceRegistrationOrchestrator],
  exports: [DeviceRegistryService, DeviceRegistrationOrchestrator],
})
export class DeviceRegistryModule { }
