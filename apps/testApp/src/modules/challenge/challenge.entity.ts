import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';

import { CommonEntity } from '../../common/common.entity';
import { TABLES } from '../../common/constants/constants';
import { ChallengeAttachmentEntity } from '../challengeAttachment/challengeAttachment.entity';
import { CommunityEntity } from '../community/community.entity';
import { OpportunityEntity } from '../opportunity/opportunity.entity';
import { OpportunityTypeEntity } from '../opportunityType/opportunityType.entity';
import { UserEntity } from '../user/user.entity';
import { ChallengeParticipantEntity } from './challengeParticipant.entity';
import { ChallengeStatuses } from '../../enum/cahllenge-status.enum';
import { WorkflowEntity } from '../workflow/workflow.entity';

@Entity(TABLES.CHALLENGE)
export class ChallengeEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ nullable: true, type: 'varchar', length: 2000 })
  description: string;

  @Column({ nullable: true, type: 'varchar', length: 2000 })
  bannerImage: string;

  @Column({
    default: false,
  })
  hasAdditionalBrief: boolean;

  @Column({ type: 'text', nullable: true })
  additionalBrief: string;

  @ManyToOne(() => OpportunityTypeEntity)
  @JoinColumn()
  opportunityType: OpportunityTypeEntity;

  @Column({
    nullable: true,
    default: true,
  })
  draft: boolean;

  @Column('integer', { array: true, nullable: true })
  tags: number[];

  @Column('integer', { array: true, default: () => "'{}'" })
  sponsors: number[];

  @Column('integer', { array: true, default: () => "'{}'" })
  moderators: number[];

  @OneToMany(
    () => ChallengeParticipantEntity,
    challengeParticipant => challengeParticipant.challenge,
  )
  challengeParticipant: ChallengeParticipantEntity[];

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;

  @RelationId((challenge: ChallengeEntity) => challenge.community)
  communityId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  // Entity Relation
  @OneToMany(() => OpportunityEntity, us => us.challenge)
  challengeOpportunities: OpportunityEntity[];

  @Column({ type: 'timestamptz', nullable: true })
  expiryStartDate;

  @Column({ type: 'timestamptz', nullable: true })
  expiryEndDate;

  @Column({
    type: 'enum',
    enum: ChallengeStatuses,
    default: ChallengeStatuses.OPEN,
  })
  status: ChallengeStatuses;

  @Column({
    nullable: true,
    default: false,
  })
  haveExpiry: boolean;

  @Column({
    nullable: false,
    type: 'int8',
    default: 0,
  })
  viewCount: number;

  @Column({ type: 'text', nullable: true })
  alertMessage: string;

  @OneToMany(
    () => ChallengeAttachmentEntity,
    challengeAttachments => challengeAttachments.challenge,
  )
  challengeAttachments: ChallengeAttachmentEntity[];

  @ManyToOne(() => WorkflowEntity)
  @JoinColumn()
  workflow: WorkflowEntity;

  @RelationId((challenge: ChallengeEntity) => challenge.workflow)
  workflowId: number;
}
