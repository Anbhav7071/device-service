import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceCredentialEntity } from './entities/device-credential.entity';
import { CredentialStatus } from '../../utils/enums/device.enum';
import { CreateDeviceCredentialDto } from './dto/create-device-credential.dto';
import { DeviceCredentialListQueryDto } from './dto/device-credential-list-query.dto';
import { PaginatedResult } from '../../common/dto/paginated-result.dto';

@Injectable()
export class DeviceCredentialService {
  private readonly logger = new Logger(DeviceCredentialService.name);

  constructor(
    @InjectRepository(DeviceCredentialEntity)
    private readonly credentialRepo: Repository<DeviceCredentialEntity>,
  ) { }

  async issueCredential(deviceId: string, tenantId: string, userId: string, dto: CreateDeviceCredentialDto): Promise<DeviceCredentialEntity> {
    // Check if there is already an active credential
    const activeCredential = await this.credentialRepo.findOne({
      where: { deviceId, tenantId, status: CredentialStatus.ACTIVE },
    });

    const newCredential = this.credentialRepo.create({
      deviceId,
      tenantId,
      ...dto,
      status: CredentialStatus.ACTIVE,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expiry 1 year from now placeholder
    });

    if (activeCredential) {
      activeCredential.status = CredentialStatus.ROTATED;
      activeCredential.rotatedFromId = newCredential.id;

      const gracePeriod = new Date();
      gracePeriod.setHours(gracePeriod.getHours() + 24);
      activeCredential.gracePeriodEndsAt = gracePeriod;

      try {
        await this.credentialRepo.manager.transaction(async manager => {
          await manager.save(activeCredential);
          await manager.save(newCredential);
        });
      } catch (error: any) {
        this.logger.error(`Failed to issue credential for device: ${deviceId}`, error.stack);
        throw new BadRequestException('Failed to issue credential');
      }
    } else {
      try {
        await this.credentialRepo.save(newCredential);
      } catch (error: any) {
        this.logger.error(`Failed to issue credential for device: ${deviceId}`, error.stack);
        throw new BadRequestException('Failed to issue credential');
      }
    }

    return newCredential;
  }

  async revokeCredential(deviceId: string, credentialId: string, tenantId: string, userId: string, reason: string): Promise<DeviceCredentialEntity> {
    const credential = await this.credentialRepo.findOne({
      where: { id: credentialId, deviceId, tenantId }
    });

    if (!credential) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    if (credential.status === CredentialStatus.REVOKED) {
      throw new ConflictException(`Credential ${credentialId} is already revoked`);
    }

    credential.status = CredentialStatus.REVOKED;
    credential.revocationReason = reason;
    credential.revokedBy = userId;
    credential.revokedAt = new Date();

    try {
      await this.credentialRepo.save(credential);
    } catch (error: any) {
      this.logger.error(`Failed to revoke credential ${credentialId} for device: ${deviceId}`, error.stack);
      throw new BadRequestException('Failed to revoke credential');
    }

    return credential;
  }

  async listCredentials(
    deviceId: string,
    tenantId: string,
    query: DeviceCredentialListQueryDto
  ): Promise<PaginatedResult<DeviceCredentialEntity>> {
    const {
      page = 1,
      limit = 20,
      whereFilter = {},
      select,
      orderBy = 'issuedAt',
      orderDirection = 'DESC',
      relations = [],
    } = query;

    const safeWhere = {
      deviceId,
      tenantId,
      ...whereFilter,
    };

    try {
      const [data, total] = await this.credentialRepo.findAndCount({
        where: safeWhere,
        select: select as any,
        relations: relations,
        order: { [orderBy]: orderDirection } as any,
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
      this.logger.error(`Failed to list credentials for device: ${deviceId}`, error.stack);
      throw new BadRequestException('Failed to list credentials');
    }
  }
}
