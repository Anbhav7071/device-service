import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DeviceType, DeviceStatus } from '../../../utils/enums/device.enum';

@Entity('device_registry')
@Index(['tenantId', 'serialNumber'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'deviceType'])
export class DeviceRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'device_type', type: 'enum', enum: DeviceType })
  deviceType: DeviceType;

  @Column({ name: 'serial_number', type: 'varchar', length: 128 })
  serialNumber: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.PENDING })
  status: DeviceStatus;

  @Column({ name: 'created_by', type: 'varchar', length: 64 })
  createdBy: string;

  @Column({ name: 'decommissioned_at', type: 'timestamptz', nullable: true })
  decommissionedAt?: Date;

  @Column({
    name: 'decommissioned_by',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  decommissionedBy?: string;

  @Column({
    name: 'decommission_reason',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  decommissionReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
