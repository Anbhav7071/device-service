import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrokerType, ConnectivityStatus } from '../../../utils/enums/device.enum';

@Entity('device_connectivity')
export class DeviceConnectivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id', type: 'uuid', unique: true })
  deviceId: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'broker_type', type: 'enum', enum: BrokerType })
  brokerType: BrokerType;

  @Column({ name: 'broker_endpoint', type: 'varchar', length: 512 })
  brokerEndpoint: string;

  @Column({
    name: 'firmware_version',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  firmwareVersion?: string;

  @Column({ name: 'connectivity_status', type: 'enum', enum: ConnectivityStatus })
  connectivityStatus: ConnectivityStatus.OFFLINE

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt?: Date;

  @Column({ name: 'publish_acl', type: 'jsonb', nullable: true })
  publishAcl?: string[];

  @Column({ name: 'subscribe_acl', type: 'jsonb', nullable: true })
  subscribeAcl?: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
