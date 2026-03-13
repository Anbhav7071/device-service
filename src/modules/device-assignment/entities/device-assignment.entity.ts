import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

// Enforces one active assignment per device
@Entity('device_assignments')
export class DeviceAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ name: 'solution_id', type: 'varchar', length: 64 })
  solutionId: string;

  @Column({ name: 'taxonomy_id', type: 'varchar', length: 64 })
  taxonomyId: string;

  @Column({ name: 'org_node_id', type: 'varchar', length: 64, nullable: true })
  orgNodeId?: string;

  @Column({ name: 'is_active', type: 'boolean' })
  isActive: boolean;

  @Column({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt: Date;

  @Column({ name: 'assigned_by', type: 'varchar', length: 64 })
  assignedBy: string;

  @Column({ name: 'unassigned_at', type: 'timestamptz', nullable: true })
  unassignedAt?: Date;

  @Column({
    name: 'unassigned_by',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  unassignedBy?: string;

  @Column({
    name: 'unassign_reason',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  unassignReason?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
