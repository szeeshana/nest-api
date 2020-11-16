import { CommonEntity } from '../../common/common.entity';
import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { StageEmailSettingTypeEnum } from '../../common/enum/stageEmailSettingsType.enum';
import { ActionTypeEntity } from '../actionType/actionType.entity';

@Entity(TABLES.STAGE_EMAIL_SETTING)
export class StageEmailSettingEntity extends CommonEntity {
  @Column({ type: 'enum', enum: StageEmailSettingTypeEnum })
  emailType: StageEmailSettingTypeEnum;

  @Column({ type: 'int4' })
  entityType: number;

  @Column({ type: 'int4' })
  entityObjectId: number;

  @Column({ type: 'integer', nullable: false })
  userId: number;

  @Column({ nullable: false, type: 'varchar', length: 250 })
  userEmail: string;

  @Column({ type: 'integer', nullable: true })
  reminderFrequency: number;

  @Column({ type: 'varchar', length: 250 })
  timeZone: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  nextRun: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  lastRun: string;

  @ManyToOne(() => ActionTypeEntity)
  @JoinColumn()
  actionType: ActionTypeEntity;

  @RelationId((setting: StageEmailSettingEntity) => setting.actionType)
  actionTypeId: number;

  @Column({ nullable: false })
  community: number;

  @Column({ nullable: false })
  stageId: number;

  @Column({ default: 0, type: 'smallint' })
  isCompleted: number;
}
