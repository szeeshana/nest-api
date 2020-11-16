import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { CommonEntity } from '../../common/common.entity';
import { TABLES } from '../../common/constants/constants';
import { CommentAttachmentEntity } from '../commentAttachment/commentAttachment.entity';
import { CommentThreadEntity } from '../commentThread/commentThread.entity';
import { UserEntity } from '../user/user.entity';
import { EntityTypeEntity } from '../entityType/entity.entity';
import { CommunityEntity } from '../community/community.entity';

@Entity(TABLES.COMMENT)
export class CommentEntity extends CommonEntity {
  // Relation
  @ManyToOne(() => CommentThreadEntity, commentThread => commentThread.id)
  @JoinColumn()
  commentThread: CommentThreadEntity;

  // Relation
  @ManyToOne(() => UserEntity, user => user.id)
  @JoinColumn()
  user: UserEntity;

  @Column({ nullable: true, type: 'varchar', length: 2000 })
  message: string;

  @Column('text', { array: true, nullable: true })
  tags: [];

  @Column('integer', { array: true, nullable: true })
  mentions: number[];

  @Column({
    nullable: false,
    type: 'smallint',
    default: 0,
  })
  anonymous: number;

  @OneToMany(
    () => CommentAttachmentEntity,
    commAttachments => commAttachments.comment,
  )
  commentAttachments: CommentAttachmentEntity;

  // Entity Relation
  @ManyToOne(() => EntityTypeEntity, en => en.id)
  @JoinColumn()
  entityType: EntityTypeEntity;

  @Column({
    type: 'varchar',
    length: 300,
    nullable: false,
  })
  entityObjectId: number;

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;
}
