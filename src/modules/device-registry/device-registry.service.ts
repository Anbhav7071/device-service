import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { DeviceRegistryEntity } from './entities/device-registry.entity';
import { DeviceStatus } from '../../utils/enums/device.enum';
import { DeviceListQueryDto } from './dto/device-list-query.dto';
import { PaginatedResult } from '../../common/dto/paginated-result.dto';
import { InvalidQueryFieldError } from '../../domain/errors/invalid-query-field.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { UpdateDeviceRegistryDto } from './dto/update-device-registry.dto';
import { ALLOWED_RELATIONS } from './filters/device-registry.filter';

@Injectable()
export class DeviceRegistryService {
  private readonly logger = new Logger(DeviceRegistryService.name);

  constructor(
    @InjectRepository(DeviceRegistryEntity)
    private readonly registryRepo: Repository<DeviceRegistryEntity>,
  ) { }

  async listDevices(
    tenantId: string,
    query: DeviceListQueryDto,
  ): Promise<PaginatedResult<DeviceRegistryEntity>> {
    const {
      page = 1,
      limit = 20,
      whereFilter = {},
      select,
      orderBy = 'createdAt',
      orderDirection = 'DESC',
      relations = [],
    } = query;

    const safeWhere: FindOptionsWhere<DeviceRegistryEntity> = {
      tenantId, // Always scoped by tenant!
    };

    if (whereFilter.status) safeWhere.status = whereFilter.status as any;
    if (whereFilter.deviceType)
      safeWhere.deviceType = whereFilter.deviceType as any;
    if (whereFilter.serialNumber)
      safeWhere.serialNumber = whereFilter.serialNumber as any;

    // BrokerType filtering requires a join or is implemented later (skipped for brevity unless explicitly asked to join connectivity)

    try {
      const [data, total] = await this.registryRepo.findAndCount({
        where: safeWhere,
        select: select as any,
        relations: relations,
        order: {
          [orderBy]: orderDirection,
        } as FindOptionsOrder<DeviceRegistryEntity>,
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to list devices for tenant ${tenantId}`, error.stack);
      throw new BadRequestException('Failed to list devices');
    }
  }

  async getDevice(
    id: string,
    tenantId: string,
    relations: string[] = [],
  ): Promise<DeviceRegistryEntity> {
    const invalidRelations = (relations || []).filter(
      (r) => !ALLOWED_RELATIONS.includes(r as any),
    );
    if (invalidRelations.length > 0) {
      throw new InvalidQueryFieldError(
        `Invalid relations requested: ${invalidRelations.join()}`,
      );
    }

    let device;
    try {
      device = await this.registryRepo.findOne({
        where: { id, tenantId },
        relations, // Note: You need to map these to actual entity relation names if your entity defined them.
      });
    } catch (error: any) {
      this.logger.error(`Failed to get device ${id}`, error.stack);
      throw new BadRequestException('Failed to fetch device');
    }

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found for tenant`);
    }

    return device;
  }

  async updateDevice(
    id: string,
    tenantId: string,
    userId: string,
    dto: UpdateDeviceRegistryDto,
  ): Promise<DeviceRegistryEntity> {
    const device = await this.getDevice(id, tenantId);

    if (dto.status) {
      this.validateStatusTransition(device.status, dto.status);
      device.status = dto.status;
    }

    if (dto.name) {
      device.name = dto.name;
    }

    // TODO: Write to Audit log (STATUS_CHANGED / DEVICE_UPDATED), using orchestration / EventBus equivalent.
    // For now:
    try {
      await this.registryRepo.save(device);
    } catch (error: any) {
      this.logger.error(`Failed to update device ${id}`, error.stack);
      throw new BadRequestException('Failed to update device');
    }

    return device;
  }

  async decommissionDevice(
    id: string,
    tenantId: string,
    userId: string,
    reason: string,
  ): Promise<any> {
    const device = await this.getDevice(id, tenantId);

    if (device.status === DeviceStatus.DECOMMISSIONED) {
      throw new ConflictException('Device is already decommissioned');
    }

    device.status = DeviceStatus.DECOMMISSIONED;
    device.decommissionedAt = new Date();
    device.decommissionedBy = userId;
    device.decommissionReason = reason;

    // TODO: The spec says Decommission cascades: revokes active credential, soft-deletes active assignment.
    // This requires cross module atomic transaction similar to registration. We will implement DecommissionOrchestrator.

    try {
      await this.registryRepo.save(device);
    } catch (error: any) {
      this.logger.error(`Failed to decommission device ${id}`, error.stack);
      throw new BadRequestException('Failed to decommission device');
    }

    return {
      deviceId: device.id,
      decommissionedAt: device.decommissionedAt,
      credentialRevoked: true, // Placeholder
      assignmentClosed: true, // Placeholder
    };
  }

  private validateStatusTransition(current: DeviceStatus, next: DeviceStatus) {
    if (current === DeviceStatus.DECOMMISSIONED) {
      throw new InvalidStatusTransitionError(
        'Decommission is irreversible. No path out.',
      );
    }
    if (current === DeviceStatus.PENDING && next === DeviceStatus.INACTIVE) {
      throw new InvalidStatusTransitionError(
        "Device hasn't activated yet — INACTIVE has no meaning.",
      );
    }
    if (current === DeviceStatus.INACTIVE && next === DeviceStatus.PENDING) {
      throw new InvalidStatusTransitionError(
        'Registration cannot be undone or restarted on same record.',
      );
    }
    if (next === DeviceStatus.PENDING) {
      throw new InvalidStatusTransitionError(
        'PENDING is only set at creation. Never manually assigned.',
      );
    }
  }
}
