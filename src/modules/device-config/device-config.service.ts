import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { DeviceConfigEntity } from './entities/device-config.entity';

@Injectable()
export class DeviceConfigService {
  private readonly logger = new Logger(DeviceConfigService.name);

  constructor(
    @InjectRepository(DeviceConfigEntity)
    private readonly configRepo: Repository<DeviceConfigEntity>,
  ) { }

  async createInitialConfig(deviceId: string, tenantId: string, userId: string, manager?: EntityManager) {
    const tempRepo = manager ? manager.getRepository(DeviceConfigEntity) : this.configRepo;

    const initialConfig = tempRepo.create({
      deviceId,
      tenantId,
      desiredState: {},
      configVersion: 1,
    });

    try {
      await tempRepo.save(initialConfig);
    } catch (error: any) {
      this.logger.error(`Failed to create initial config for device: ${deviceId}`, error.stack);
      throw new BadRequestException('Failed to create device configuration');
    }

    return initialConfig;
  }

  async getConfig(deviceId: string, tenantId: string): Promise<DeviceConfigEntity> {
    let config;
    try {
      config = await this.configRepo.findOne({ where: { deviceId, tenantId } });
    } catch (error: any) {
      this.logger.error(`Failed to fetch config for device: ${deviceId}`, error.stack);
      throw new BadRequestException('Failed to fetch device configuration');
    }

    if (!config) {
      throw new NotFoundException(`Config for device ${deviceId} not found`);
    }

    return config;
  }

  async updateDesiredState(deviceId: string, tenantId: string, userId: string, desiredState: Record<string, any>): Promise<DeviceConfigEntity> {
    const config = await this.getConfig(deviceId, tenantId);

    config.desiredState = desiredState;
    config.configVersion += 1;

    try {
      // Note: Optimistic locking will automatically check the `version` column during save
      await this.configRepo.save(config);
    } catch (error: any) {
      this.logger.error(`Failed to update desired state for device: ${deviceId}`, error.stack);
      throw new BadRequestException('Failed to update desired state');
    }

    return config;
  }

  async updateReportedState(deviceId: string, tenantId: string, reportedState: Record<string, any>, reportedVersion: number): Promise<DeviceConfigEntity> {
    const config = await this.getConfig(deviceId, tenantId);

    // Simple reconciliation: only apply if the device is reporting a newer or equal state version
    if (!config.reportedVersion || reportedVersion >= config.reportedVersion) {
      config.reportedState = reportedState;
      config.reportedVersion = reportedVersion;

      try {
        await this.configRepo.save(config);
      } catch (error: any) {
        this.logger.error(`Failed to update reported state for device: ${deviceId}`, error.stack);
        throw new BadRequestException('Failed to update reported state');
      }
    }
    return config;
  }
}
