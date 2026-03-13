import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDeviceCredentialDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(4096)
    certPem: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    certFingerprint: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    issuerCertId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(512)
    privateKeyRef: string;
}

export class RevokeDeviceCredentialDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(512)
    reason: string;
}
