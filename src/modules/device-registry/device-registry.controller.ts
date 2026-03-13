import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { DeviceRegistryService } from './device-registry.service';
import { DeviceRegistrationOrchestrator } from './device-registration.orchestrator';
import { CreateDeviceRegistryDto } from './dto/create-device-registry.dto';
import {
  UpdateDeviceRegistryDto,
  DecommissionDeviceDto,
} from './dto/update-device-registry.dto';
import { DeviceListQueryDto } from './dto/device-list-query.dto';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { Resource } from '../../permissions/resource.enum';
import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { UUIDValidationPipe } from 'src/utils/pipes/uuid-validator.pipe';


@RequirePermission(Resource.DEVICE)
@Controller({
  path: 'device-registry',
  version: '1',
})
export class DeviceRegistryController {
  constructor(
    private readonly deviceRegistryService: DeviceRegistryService,
    private readonly orchestrator: DeviceRegistrationOrchestrator,
  ) { }

  @Post()
  async registerDevice(
    @AuthenticatedUser() user: any,
    @Body() dto: CreateDeviceRegistryDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.orchestrator.registerDevice(tenantId, userId, dto);
  }

  @Get()
  async listDevices(
    @AuthenticatedUser() user: any,
    @Query() query: DeviceListQueryDto,
  ) {
    const tenantId = user.tenantId;
    return this.deviceRegistryService.listDevices(tenantId, query);
  }

  @Get(':id')
  async getDevice(
    @Param('id', UUIDValidationPipe) id: string,
    @AuthenticatedUser() user: any,
    @Query('relations') relations: string[],
  ) {
    const tenantId = user.tenantId;
    return this.deviceRegistryService.getDevice(id, tenantId, relations);
  }

  @Patch(':id')
  async updateDevice(
    @Param('id', UUIDValidationPipe) id: string,
    @AuthenticatedUser() user: any,
    @Body() dto: UpdateDeviceRegistryDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.deviceRegistryService.updateDevice(id, tenantId, userId, dto);
  }

  @Post(':id/decommission')
  async decommissionDevice(
    @Param('id', UUIDValidationPipe) id: string,
    @AuthenticatedUser() user: any,
    @Body() dto: DecommissionDeviceDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.deviceRegistryService.decommissionDevice(
      id,
      tenantId,
      userId,
      dto.reason,
    );
  }
}
