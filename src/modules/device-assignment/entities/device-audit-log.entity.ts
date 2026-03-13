import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction, ActorType } from '../../../utils/enums/device.enum';

@Entity('device_audit_log')
@Index(['tenantId', 'deviceId', 'createdAt'])
@Index(['tenantId', 'actorId', 'createdAt'])
@Index(['tenantId', 'action', 'createdAt'])
export class DeviceAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'actor_id', type: 'varchar', length: 64 })
  actorId: string;

  @Column({ name: 'actor_type', type: 'enum', enum: ActorType })
  actorType: ActorType;

  @Column({ name: 'before_state', type: 'jsonb', nullable: true })
  beforeState?: any;

  @Column({ name: 'after_state', type: 'jsonb', nullable: true })
  afterState?: any;

  @Column({ type: 'varchar', length: 512, nullable: true })
  reason?: string;

  @Column({
    name: 'correlation_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  correlationId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
