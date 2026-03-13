import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceConnectivityService } from './device-connectivity.service';
import { DeviceConnectivityController } from './device-connectivity.controller';
import { DeviceConnectivityEntity } from './entities/device-connectivity.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DeviceConnectivityEntity])],
    controllers: [DeviceConnectivityController],
    providers: [DeviceConnectivityService],
    exports: [DeviceConnectivityService],
})
export class DeviceConnectivityModule { }
