import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CredentialStatus } from '../../../utils/enums/device.enum';

@Entity('device_credentials')
@Index(['certFingerprint'], { unique: true })
@Index(['deviceId', 'status'])
@Index(['tenantId', 'status', 'expiresAt'])
export class DeviceCredentialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({
    name: 'cert_fingerprint',
    type: 'varchar',
    length: 128,
    unique: true,
  })
  certFingerprint: string;

  @Column({ name: 'cert_pem', type: 'text' })
  certPem: string;

  @Column({ name: 'private_key_ref', type: 'varchar', length: 512 })
  privateKeyRef: string;

  @Column({ name: 'issuer_cert_id', type: 'varchar', length: 128 })
  issuerCertId: string;

  @Column({ type: 'enum', enum: CredentialStatus })
  status: CredentialStatus;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column({
    name: 'revocation_reason',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  revocationReason?: string;

  @Column({ name: 'revoked_by', type: 'varchar', length: 64, nullable: true })
  revokedBy?: string;

  @Column({ name: 'rotated_from_id', type: 'uuid', nullable: true })
  rotatedFromId?: string;

  @Column({ name: 'grace_period_ends_at', type: 'timestamptz', nullable: true })
  gracePeriodEndsAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
