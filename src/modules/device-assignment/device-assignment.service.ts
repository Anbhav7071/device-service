import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceAssignmentEntity } from './entities/device-assignment.entity';
import { CreateDeviceAssignmentDto } from './dto/create-device-assignment.dto';

@Injectable()
export class DeviceAssignmentService {
  private readonly logger = new Logger(DeviceAssignmentService.name);

  constructor(
    @InjectRepository(DeviceAssignmentEntity)
    private readonly assignmentRepo: Repository<DeviceAssignmentEntity>,
  ) { }

  async assignDevice(deviceId: string, tenantId: string, userId: string, dto: CreateDeviceAssignmentDto): Promise<DeviceAssignmentEntity> {
    // Deactivate any currently active assignments first
    const activeAssignments = await this.assignmentRepo.find({
      where: { deviceId, tenantId, isActive: true }
    });

    for (const assignment of activeAssignments) {
      assignment.isActive = false;
      assignment.unassignedAt = new Date();
      assignment.unassignedBy = userId;
    }

    const newAssignment = this.assignmentRepo.create({
      deviceId,
      tenantId,
      orgNodeId: dto.orgNodeId,
      taxonomyId: dto.taxonomyId,
      isActive: dto.isActive !== false,
      assignedBy: userId,
      assignedAt: new Date()
    });

    try {
      await this.assignmentRepo.manager.transaction(async manager => {
        if (activeAssignments.length > 0) {
          await manager.save(activeAssignments);
        }
        await manager.save(newAssignment);
      });
    } catch (error: any) {
      this.logger.error(`Failed to assign device: ${deviceId}`, error.stack);
      throw new BadRequestException('Failed to assign device');
    }

    return newAssignment;
  }

  async unassignDevice(deviceId: string, tenantId: string, userId: string) {
    const activeAssignments = await this.assignmentRepo.find({
      where: { deviceId, tenantId, isActive: true }
    });

    if (activeAssignments.length === 0) {
      throw new NotFoundException(`No active assignment found for device ${deviceId}`);
    }

    for (const assignment of activeAssignments) {
      assignment.isActive = false;
      assignment.unassignedAt = new Date();
    }

    try {
      await this.assignmentRepo.save(activeAssignments);
    } catch (error: any) {
      this.logger.error(`Failed to unassign device: ${deviceId}`, error.stack);
      throw new BadRequestException('Failed to unassign device');
    }

    return { success: true, count: activeAssignments.length };
  }
}
