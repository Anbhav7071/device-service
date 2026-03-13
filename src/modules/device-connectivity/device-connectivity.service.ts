import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceConnectivityEntity } from './entities/device-connectivity.entity';
import { UpdateDeviceConnectivityDto } from './dto/update-device-connectivity.dto';

@Injectable()
export class DeviceConnectivityService {
    private readonly logger = new Logger(DeviceConnectivityService.name);

    constructor(
        @InjectRepository(DeviceConnectivityEntity)
        private readonly connectivityRepo: Repository<DeviceConnectivityEntity>,
    ) { }

    async getConnectivity(deviceId: string, tenantId: string): Promise<DeviceConnectivityEntity> {
        let connectivity;
        try {
            connectivity = await this.connectivityRepo.findOne({ where: { deviceId, tenantId } });
        } catch (error: any) {
            this.logger.error(`Failed to fetch connectivity for device: ${deviceId}`, error.stack);
            throw new BadRequestException('Failed to fetch device connectivity');
        }

        if (!connectivity) {
            throw new NotFoundException('Connectivity not found for device');
        }

        return connectivity;
    }

    async updateConnectivity(deviceId: string, tenantId: string, userId: string, dto: UpdateDeviceConnectivityDto): Promise<DeviceConnectivityEntity> {
        const connectivity = await this.getConnectivity(deviceId, tenantId);

        if (dto.brokerType) connectivity.brokerType = dto.brokerType;
        if (dto.brokerEndpoint) connectivity.brokerEndpoint = dto.brokerEndpoint;
        if (dto.publishAcl) connectivity.publishAcl = dto.publishAcl;
        if (dto.subscribeAcl) connectivity.subscribeAcl = dto.subscribeAcl;

        try {
            await this.connectivityRepo.save(connectivity);
        } catch (error: any) {
            this.logger.error(`Failed to update connectivity for device: ${deviceId}`, error.stack);
            throw new BadRequestException('Failed to update device connectivity');
        }

        return connectivity;
    }
}
