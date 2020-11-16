import { CommonEntity } from '../../common/common.entity';
import { Entity, Column } from 'typeorm';
import { TABLES } from '../../common/constants/constants';

@Entity(TABLES.ACTION_ITEM_LOG)
export class ActionItemLogEntity extends CommonEntity {
  @Column({ nullable: false })
  actionItemId: number;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  actionItemTitle: string;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  actionItemAbbreviation: string;

  @Column({ type: 'timestamptz', nullable: true })
  actionDueDate: Date;

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
  entityObjectId: number;

  @Column({ nullable: false })
  entityTypeId: number;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  entityTypeName: string;

  @Column({ nullable: true, type: 'text' })
  entityTitle: string;

  @Column({ nullable: true, type: 'text' })
  entityDescription: string;

  @Column({ nullable: true, type: 'text' })
  entityImageUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  entityOperendObject;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: 0, type: 'smallint' })
  isEmailCreated: number;

  @Column({ type: 'text', nullable: true })
  aggregatedId: string;

  @Column({
    default: false,
  })
  isEmail: boolean;

  @Column({
    default: true,
  })
  isLog: boolean;

  @Column({
    default: true,
  })
  isNotification: boolean;

  @Column({ nullable: false })
  community: number;

  @Column({ nullable: true, type: 'varchar', length: 250 })
  communityName: string;

  @Column({ type: 'text', nullable: true })
  url: string;
}
