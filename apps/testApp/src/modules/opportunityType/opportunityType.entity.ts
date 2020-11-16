import { CommonEntity } from '../../common/common.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  RelationId,
} from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { CommunityEntity } from '../community/community.entity';
import { OpportunityTypePostingExperienceEntity } from '../opportunityTypePostingExperience/opportunityTypePostingExperience.entity';
import { WorkflowEntity } from '../workflow/workflow.entity';

@Entity(TABLES.OPPORTUNITY_TYPE)
@Index(['community', 'abbreviation'], { unique: true })
export class OpportunityTypeEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 250 })
  name: string;

  @Column({ type: 'varchar', length: 2000 })
  description: string;

  @Column({ nullable: true, type: 'varchar', length: 250 })
  icon: string;

  @Column({ nullable: true, type: 'varchar', length: 250 })
  color: string;

  @Column({
    nullable: true,
  })
  isEnabled: boolean;

  @Column({ nullable: false, type: 'varchar' })
  abbreviation: string;

  @ManyToOne(() => OpportunityTypePostingExperienceEntity)
  @JoinColumn()
  postingExperience: OpportunityTypePostingExperienceEntity;

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;

  @RelationId(
    (opportunityType: OpportunityTypeEntity) => opportunityType.community,
  )
  communityId: number;

  @ManyToOne(() => WorkflowEntity)
  @JoinColumn()
  workflow: WorkflowEntity;

  @RelationId((oppType: OpportunityTypeEntity) => oppType.workflow)
  workflowId: number;
}
