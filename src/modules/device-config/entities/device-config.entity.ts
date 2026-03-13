import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('device_configs')
export class DeviceConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id', type: 'uuid', unique: true })
  deviceId: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'desired_state', type: 'jsonb' })
  desiredState: any;

  @Column({ name: 'reported_state', type: 'jsonb', nullable: true })
  reportedState?: any;

  @Column({ name: 'config_version', type: 'int' })
  configVersion: number;

  @Column({ name: 'reported_version', type: 'int', nullable: true })
  reportedVersion?: number;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 64 })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @VersionColumn()
  version: number; // For optimistic locking
}
