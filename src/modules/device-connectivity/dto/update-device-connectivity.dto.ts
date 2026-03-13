import { IsOptional, IsArray, IsString, IsEnum, MaxLength } from 'class-validator';
import { BrokerType } from '../../../utils/enums/device.enum';

export class UpdateDeviceConnectivityDto {
    @IsOptional()
    @IsEnum(BrokerType)
    brokerType?: BrokerType;

    @IsOptional()
    @IsString()
    @MaxLength(512)
    brokerEndpoint?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    publishAcl?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    subscribeAcl?: string[];
}
