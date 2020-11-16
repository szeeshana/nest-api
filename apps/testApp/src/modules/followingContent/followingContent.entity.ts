import { CommonEntity } from '../../common/common.entity';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { EntityTypeEntity } from '../entityType/entity.entity';
import { UserFollowingContents } from './user.followingContent.entity';
import { CommunityEntity } from '../community/community.entity';

@Entity(TABLES.FOLLOWING_CONTENT)
export class FollowingContentEntity extends CommonEntity {
  @Column({ nullable: true, type: 'varchar', length: 250 })
  displayName: string;

  @Column({
    type: 'varchar',
    length: 300,
    nullable: false,
  })
  entityObjectId: string;

  // Entity Relation
  @ManyToOne(() => EntityTypeEntity, en => en.id)
  entityType: EntityTypeEntity;

  // Entity Relation
  @OneToMany(() => UserFollowingContents, us => us.followingContent)
  userFollowingContents: UserFollowingContents[];

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;

  @Column({
    type: 'text',
    nullable: true,
  })
  url: string;

  @Column({ nullable: true, type: 'varchar', length: 200 })
  email: string;
}
