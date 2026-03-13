import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CreateDeviceCredentialDto, RevokeDeviceCredentialDto } from './dto/create-device-credential.dto';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { Resource } from '../../permissions/resource.enum';
import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { DeviceCredentialService } from './device-credential.service';
import { UUIDValidationPipe } from 'src/utils/pipes/uuid-validator.pipe';
import { DeviceCredentialListQueryDto } from './dto/device-credential-list-query.dto';

@Controller({
  path: 'device-credentials',
  version: '1',
})
@RequirePermission(Resource.CREDENTIAL)
export class DeviceCredentialController {
  constructor(private readonly deviceCredentialService: DeviceCredentialService) { }

  @Post()
  async issueCredential(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @AuthenticatedUser() user: any,
    @Body() dto: CreateDeviceCredentialDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.deviceCredentialService.issueCredential(deviceId, tenantId, userId, dto);
  }

  @Post(':credentialId/revoke')
  async revokeCredential(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @Param('credentialId', UUIDValidationPipe) credentialId: string,
    @AuthenticatedUser() user: any,
    @Body() dto: RevokeDeviceCredentialDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.sub;
    return this.deviceCredentialService.revokeCredential(deviceId, credentialId, tenantId, userId, dto.reason);
  }

  @Get()
  async listCredentials(
    @Param('deviceId', UUIDValidationPipe) deviceId: string,
    @AuthenticatedUser() user: any,
    @Query() query: DeviceCredentialListQueryDto,
  ) {
    const tenantId = user.tenantId;
    return this.deviceCredentialService.listCredentials(deviceId, tenantId, query);
  }
}