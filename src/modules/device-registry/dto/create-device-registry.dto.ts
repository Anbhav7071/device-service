import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DeviceType, BrokerType } from '../../../utils/enums/device.enum';

export class CreateDeviceRegistryDto {
  @IsEnum(DeviceType)
  @IsNotEmpty()
  deviceType: DeviceType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @IsEnum(BrokerType)
  @IsNotEmpty()
  brokerType: BrokerType;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  brokerEndpoint?: string;

  @IsOptional()
  @IsString()
  csrPayload?: string;
}
