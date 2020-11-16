import { CommonEntity } from '../../common/common.entity';
import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { RoleEntity } from '../role/role.entity';
import { RoleActorTypes } from '../../enum';
import { EntityTypeEntity } from '../entityType/entity.entity';
import { CommunityEntity } from '../community/community.entity';

@Entity(TABLES.ROLE_ACTORS)
export class RoleActorsEntity extends CommonEntity {
  @ManyToOne(() => RoleEntity)
  @JoinColumn()
  role: RoleEntity;

  @RelationId((roleActor: RoleActorsEntity) => roleActor.role)
  roleId: number;

  @Column({
    type: 'enum',
    enum: RoleActorTypes,
    default: RoleActorTypes.USER,
  })
  actorType: RoleActorTypes;

  @Column({
    type: 'int4',
    nullable: false,
  })
  actorId: number;

  @Column({
    type: 'int4',
    nullable: true,
  })
  entityObjectId: number;

  @ManyToOne(() => EntityTypeEntity)
  @JoinColumn()
  entityType: EntityTypeEntity;

  @RelationId((roleActor: RoleActorsEntity) => roleActor.entityType)
  entityTypeId: number;

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;

  @RelationId((roleActor: RoleActorsEntity) => roleActor.community)
  communityId: number;
}
