import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { DeviceAuditLogEntity } from './entities/device-audit-log.entity';
import { AuditAction, ActorType } from '../../utils/enums/device.enum';

export interface CreateAuditLogDto {
  tenantId: string;
  deviceId: string;
  action: AuditAction;
  actorId: string;
  actorType: ActorType;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  correlationId?: string;
}

@Injectable()
export class DeviceAuditLogService {
  constructor(
    @InjectRepository(DeviceAuditLogEntity)
    private readonly auditRepo: Repository<DeviceAuditLogEntity>,
  ) { }

  async logAction(dto: CreateAuditLogDto, manager?: EntityManager) {
    const tempRepo = manager
      ? manager.getRepository(DeviceAuditLogEntity)
      : this.auditRepo;

    const log = tempRepo.create(dto);
    await tempRepo.save(log);
    return log;
  }

  async getDeviceAuditLogs(deviceId: string, tenantId: string): Promise<DeviceAuditLogEntity[]> {
    return this.auditRepo.find({
      where: { deviceId, tenantId },
      order: { createdAt: 'DESC' },
      take: 100 // Reasonable default cap
    });
  }
}
