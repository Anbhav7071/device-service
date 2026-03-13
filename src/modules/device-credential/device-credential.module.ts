import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceCredentialService } from './device-credential.service';
import { DeviceCredentialController } from './device-credential.controller';
import { DeviceCredentialEntity } from './entities/device-credential.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceCredentialEntity])],
  controllers: [DeviceCredentialController],
  providers: [DeviceCredentialService],
  exports: [DeviceCredentialService],
})
export class DeviceCredentialModule {}
