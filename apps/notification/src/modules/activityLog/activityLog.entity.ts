import { CommonEntity } from './../../common/common.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { ActionTypeEntity } from '../actionType/actionType.entity';

@Entity(TABLES.ACTIVITY_LOG)
export class ActivityLogEntity extends CommonEntity {
  @ManyToOne(() => ActionTypeEntity)
  @JoinColumn()
  actionType: ActionTypeEntity;

  @Column({
    type: 'text',
    nullable: true,
  })
  ip: string;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  userName: string;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  userEmail: string;

  @Column({ nullable: false })
  actorUserId: number;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  actorUserName: string;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  actorUserEmail: string;

  @Column({ nullable: false })
  entityObjectId: number;

  @Column({ nullable: false })
  entityId: number;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  entityName: string;

  @Column({ nullable: true, type: 'text' })
  entityTitle: string;

  @Column({ nullable: true, type: 'text' })
  entityDescription: string;

  @Column({ nullable: false })
  community: number;

  @Column({ nullable: true, type: 'varchar', length: 250 })
  communityName: string;

  @Column({ default: 0, type: 'smallint' })
  isRead: number;

  @Column({ default: 0, type: 'smallint' })
  createEmail: number;

  @Column({ type: 'text', nullable: true })
  aggregatedId: string;

  @Column({ type: 'simple-json', nullable: true })
  entityOperendObject;

  @Column({
    default: true,
  })
  isNotification: boolean;

  @Column({
    default: true,
  })
  isActivity: boolean;

  @Column({
    default: true,
  })
  isEmail: boolean;
}
