import { CommonEntity } from '../../common/common.entity';
import {
  Entity,
  // Column,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TABLES } from '../../common/constants/constants';
// import { EntityTypeEntity } from '../entityType/entity.entity';
import { CommunityEntity } from '../community/community.entity';
import { StageEntity } from './stage.entity';
import { OpportunityEntity } from '../opportunity/opportunity.entity';
import { ActionItemEntity } from '../actionItem/actionItem.entity';

@Entity(TABLES.STAGE_HISTORY)
export class StageHistoryEntity extends CommonEntity {
  @ManyToOne(() => StageEntity)
  @JoinColumn()
  stage: StageEntity;

  @ManyToOne(() => OpportunityEntity)
  @JoinColumn()
  opportunity: OpportunityEntity;

  @ManyToOne(() => ActionItemEntity)
  @JoinColumn()
  actionItem: ActionItemEntity;

  @Column({ nullable: false, type: 'json' })
  computeObject: {};

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => null,
    nullable: true,
  })
  enteringAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => null,
    nullable: true,
  })
  exitingAt: Date;

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;
}
