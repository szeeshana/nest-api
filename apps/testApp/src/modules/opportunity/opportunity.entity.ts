import { CommonEntity } from '../../common/common.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  AfterInsert,
  getConnection,
  RelationId,
} from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { CommunityEntity } from '../community/community.entity';
import { UserEntity } from '../user/user.entity';
import { OpportunityTypeEntity } from '../opportunityType/opportunityType.entity';
import { OpportunityAttachmentEntity } from '../opportunityAttachment/opportunityAttachment.entity';
import { EntityTypeEntity } from '../entityType/entity.entity';
import { ChallengeEntity } from '../challenge/challenge.entity';
import { OpportunityUserEntity } from '../opportunityUser/opportunityUser.entity';
import { StageEntity } from '../stage/stage.entity';
import { WorkflowEntity } from '../workflow/workflow.entity';
import { CustomFieldDataEntity } from '../customField/customFieldData.entity';
@Entity(TABLES.OPPORTUNITY)
export class OpportunityEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 250 })
  title: string;

  @Column({ nullable: true, type: 'varchar', length: 2000 })
  description: string;

  @Column({
    nullable: true,
    default: true,
  })
  draft: boolean;

  //Category

  @Column('numeric', { array: true, nullable: true })
  tags: [];

  @Column('integer', { array: true, nullable: true })
  mentions: number[];

  // @ManyToOne(
  //   () => OpportunityTypeEntity,
  //   opportunityType => opportunityType.typeId,
  //   { primary: true },
  // )
  // @JoinColumn({ name: 'type_id' })
  // opportunityType: OpportunityTypeEntity;

  @ManyToOne(() => OpportunityTypeEntity)
  @JoinColumn()
  opportunityType: OpportunityTypeEntity;

  @RelationId((opportunity: OpportunityEntity) => opportunity.opportunityType)
  opportunityTypeId: number;

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;

  @RelationId((opportunity: OpportunityEntity) => opportunity.community)
  communityId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @RelationId((opportunity: OpportunityEntity) => opportunity.user)
  userId: number;

  @OneToMany(
    () => OpportunityAttachmentEntity,
    oppAttachments => oppAttachments.opportunity,
  )
  opportunityAttachments: OpportunityAttachmentEntity[];

  @Column({
    nullable: false,
    type: 'smallint',
    default: 0,
  })
  anonymous: number;

  @Column({
    nullable: false,
    type: 'int8',
    default: 0,
  })
  viewCount: number;

  @OneToMany(() => OpportunityUserEntity, ou => ou.opportunity)
  opportunityUsers: OpportunityUserEntity[];

  @AfterInsert()
  generateId = async () => {
    if (this.tags.length) {
      const dataEntityType = await getConnection()
        .createQueryBuilder()
        .select('entityType')
        .from(EntityTypeEntity, 'entityType')
        .where('entityType.abbreviation = :abbreviation', {
          abbreviation: `idea`,
        })
        .getOne();
      const data = [];
      for (const iterator of this.tags) {
        data.push({
          tag: iterator,
          entityObjectId: this.id,
          entityType: dataEntityType.id,
        });
      }
      // await getConnection()
      //   .createQueryBuilder()
      //   .select(TABLES.TAG_REFERENCE_MAPPING)
      //   .from(TABLES.TAG_REFERENCE_MAPPING, 'tag_map')
      //   .where('tag_map.tag = :tag', { tag: `tagId` })
      //   .andWhere('tag_map.id = :id', { id: 1 })
      //   .getOne();
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(TABLES.TAG_REFERENCE_MAPPING)
        .values(data)
        .execute();
    }
  };

  @ManyToOne(() => ChallengeEntity)
  @JoinColumn()
  challenge: ChallengeEntity;

  @RelationId((opportunity: OpportunityEntity) => opportunity.challenge)
  challengeId: number;

  @ManyToOne(() => StageEntity)
  @JoinColumn()
  stage: StageEntity;

  @RelationId((opportunity: OpportunityEntity) => opportunity.stage)
  stageId: number;

  @ManyToOne(() => WorkflowEntity)
  @JoinColumn()
  workflow: WorkflowEntity;

  @Column({ type: 'timestamptz', nullable: true })
  stageAttachmentDate: Date;

  @RelationId((opportunity: OpportunityEntity) => opportunity.workflow)
  workflowId: number;

  @OneToMany(
    () => CustomFieldDataEntity,
    customFieldDataEntity => customFieldDataEntity.opportunity,
  )
  customFieldDataEntity: CustomFieldDataEntity[];
}
