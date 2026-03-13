import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceConfigService } from './device-config.service';
import { DeviceConfigController } from './device-config.controller';
import { DeviceConfigEntity } from './entities/device-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceConfigEntity])],
  controllers: [DeviceConfigController],
  providers: [DeviceConfigService],
  exports: [DeviceConfigService],
})
export class DeviceConfigModule {}
