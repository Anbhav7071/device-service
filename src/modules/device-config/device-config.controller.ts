import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { DeviceConfigService } from './device-config.service';
import { UpdateDeviceConfigDto } from './dto/update-device-config.dto';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { Resource } from '../../permissions/resource.enum';
import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { UUIDValidationPipe } from 'src/utils/pipes/uuid-validator.pipe';

@Controller({
  path: 'device-config',
  version: '1',
})
@RequirePermission(Resource.CONFIG)
export class DeviceConfigController {
  constructor(private readonly deviceConfigService: DeviceConfigService) { }

  @Get()
  async getConfig(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @AuthenticatedUser() user: any,
  ) {
    const tenantId = user.tenantId;
    return this.deviceConfigService.getConfig(deviceId, tenantId);
  }

  @Patch()
  async updateDesiredState(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @AuthenticatedUser() user: any,
    @Body() dto: UpdateDeviceConfigDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.deviceConfigService.updateDesiredState(deviceId, tenantId, userId, dto.desiredState);
  }
}
