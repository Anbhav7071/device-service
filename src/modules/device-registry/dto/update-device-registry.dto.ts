import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { DeviceStatus } from '../../../utils/enums/device.enum';

export class UpdateDeviceRegistryDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}

export class DecommissionDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  reason: string;
}
