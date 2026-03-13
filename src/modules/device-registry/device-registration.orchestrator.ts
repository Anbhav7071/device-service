import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { DeviceRegistryEntity } from './entities/device-registry.entity';
import { DeviceConnectivityEntity } from '../device-connectivity/entities/device-connectivity.entity';
import {
  DeviceStatus,
  DeviceType,
  BrokerType,
  AuditAction,
  ActorType,
} from '../../utils/enums/device.enum';

import { DeviceConfigService } from '../device-config/device-config.service';

import { DeviceAuditLogService } from '../device-assignment/device-audit-log.service';
import { ConfigService } from '@nestjs/config';

export interface RegisterDeviceDto {
  deviceType: DeviceType;
  serialNumber: string;
  name: string;
  brokerType: BrokerType;
  brokerEndpoint?: string;
}

@Injectable()
export class DeviceRegistrationOrchestrator {
  constructor(
    private readonly dataSource: DataSource,
    private readonly deviceConfigService: DeviceConfigService,
    private readonly auditLogService: DeviceAuditLogService,
    private readonly configService: ConfigService,
  ) { }

  async registerDevice(
    tenantId: string,
    userId: string,
    dto: RegisterDeviceDto,
  ) {
    const defaultBrokerEndpoint = this.configService.get<string>('DEFAULT_BROKER_ENDPOINT') || 'mqtt://localhost:1883';
    const brokerEndpoint = dto.brokerEndpoint || defaultBrokerEndpoint;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Create Identity / Registry Record
      const registryRepo = manager.getRepository(DeviceRegistryEntity);
      const device = registryRepo.create({
        tenantId,
        deviceType: dto.deviceType,
        serialNumber: dto.serialNumber,
        name: dto.name,
        status: DeviceStatus.PENDING,
        createdBy: userId,
      });
      await registryRepo.save(device);

      // 2. Create Connectivity Infrastructure State
      const connectivityRepo = manager.getRepository(DeviceConnectivityEntity);
      const topicPrefix = `${tenantId}/unassigned/${device.id}`;
      const connectivity = connectivityRepo.create({
        deviceId: device.id,
        tenantId,
        brokerType: dto.brokerType,
        brokerEndpoint: brokerEndpoint,
        publishAcl: [`${topicPrefix}/telemetry`, `${topicPrefix}/heartbeat`],
        subscribeAcl: [`${topicPrefix}/commands`, `${topicPrefix}/ota`],
      });
      await connectivityRepo.save(connectivity);

      // 3. Direct Transation calls to other modules (No Event Bus)
      await this.deviceConfigService.createInitialConfig(
        device.id,
        tenantId,
        userId,
        manager,
      );


      // 4. Global Audit Logging
      await this.auditLogService.logAction(
        {
          tenantId,
          deviceId: device.id,
          action: AuditAction.DEVICE_REGISTERED,
          actorId: userId,
          actorType: ActorType.USER,
          afterState: { device, connectivity },
        },
        manager,
      );

      return device;
    });
  }
}
