import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateDeviceAssignmentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    orgNodeId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    taxonomyId: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;
}
