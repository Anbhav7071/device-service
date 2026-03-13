import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DeviceAssignmentService } from './device-assignment.service';
import { DeviceAuditLogService } from './device-audit-log.service';
import { CreateDeviceAssignmentDto } from './dto/create-device-assignment.dto';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { Resource } from '../../permissions/resource.enum';
import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { UUIDValidationPipe } from 'src/utils/pipes/uuid-validator.pipe';

@Controller({
  path: 'device-assignment',
  version: '1',
})
@RequirePermission(Resource.ASSIGNMENT)
export class DeviceAssignmentController {
  constructor(
    private readonly deviceAssignmentService: DeviceAssignmentService,
    private readonly deviceAuditLogService: DeviceAuditLogService
  ) { }

  @Post('assignments')
  async assignDevice(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @AuthenticatedUser() user: any,
    @Body() dto: CreateDeviceAssignmentDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.deviceAssignmentService.assignDevice(deviceId, tenantId, userId, dto);
  }

  @Post('assignments/unassign')
  async unassignDevice(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @AuthenticatedUser() user: any,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.deviceAssignmentService.unassignDevice(deviceId, tenantId, userId);
  }

  @Get('audit')
  async getAuditLogs(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @AuthenticatedUser() user: any,
  ) {
    const tenantId = user.tenantId;
    return this.deviceAuditLogService.getDeviceAuditLogs(deviceId, tenantId);
  }
}
