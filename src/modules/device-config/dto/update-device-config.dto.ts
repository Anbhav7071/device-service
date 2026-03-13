import { IsObject, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateDeviceConfigDto {
    @IsObject()
    @IsNotEmpty()
    desiredState: Record<string, any>;
}
