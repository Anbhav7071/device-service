import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceAssignmentService } from './device-assignment.service';
import { DeviceAuditLogService } from './device-audit-log.service';
import { DeviceAssignmentController } from './device-assignment.controller';
import { DeviceAssignmentEntity } from './entities/device-assignment.entity';
import { DeviceAuditLogEntity } from './entities/device-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceAssignmentEntity, DeviceAuditLogEntity]),
  ],
  controllers: [DeviceAssignmentController],
  providers: [DeviceAssignmentService, DeviceAuditLogService],
  exports: [DeviceAssignmentService, DeviceAuditLogService],
})
export class DeviceAssignmentModule {}
