import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { DeviceConnectivityService } from './device-connectivity.service';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { Resource } from '../../permissions/resource.enum';
import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { UUIDValidationPipe } from 'src/utils/pipes/uuid-validator.pipe';
import { UpdateDeviceConnectivityDto } from './dto/update-device-connectivity.dto';

@Controller({
    path: 'device-connectivity',
    version: '1',
})
@RequirePermission(Resource.TELEMETRY)
export class DeviceConnectivityController {
    constructor(private readonly deviceConnectivityService: DeviceConnectivityService) { }

    @Get()
    async getConnectivity(
        @Param('deviceId', UUIDValidationPipe) deviceId: string,
        @AuthenticatedUser() user: any,
    ) {
        const tenantId = user.tenantId;
        return this.deviceConnectivityService.getConnectivity(deviceId, tenantId);
    }

    @Patch()
    async updateConnectivity(
        @Param('deviceId', UUIDValidationPipe) deviceId: string,
        @AuthenticatedUser() user: any,
        @Body() dto: UpdateDeviceConnectivityDto,
    ) {
        const tenantId = user.tenantId;
        const userId = user.sub;
        return this.deviceConnectivityService.updateConnectivity(deviceId, tenantId, userId, dto);
    }
}
