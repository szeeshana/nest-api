import { CommunityEntity } from './../community/community.entity';
import { InviteStatus } from './../../enum/invite-status.enum';
import { CommonEntity } from './../../common/common.entity';
import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { RoleEntity } from '../role/role.entity';
import { UserEntity } from '../user/user.entity';

@Entity(TABLES.INVITE)
export class InviteEntity extends CommonEntity {
  @Column({ nullable: true, type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  email: string;

  @Column({ type: 'varchar', length: 250 })
  inviteCode: string;

  @Column({ nullable: true, type: 'simple-json' })
  bounceInfo: {}; // need to define what props bounceInfo can have

  @Column({ type: 'varchar', length: 250 })
  invitedByUserId: string;

  @Column({ type: 'varchar', length: 300 })
  senderName: string;

  @Column()
  isSSO: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  expiryDate: Date;

  @Column()
  isOpened: boolean;

  @Column()
  isEmailLinkClicked: boolean;

  @Column()
  emailOpenedCount: number;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.NOTSENT,
  })
  statusCode: InviteStatus;

  @ManyToOne(() => RoleEntity)
  @JoinColumn()
  role: RoleEntity;

  @Column('text', { array: true, nullable: true })
  circles: [];

  @ManyToOne(() => CommunityEntity, community => community.id)
  @JoinColumn()
  community: CommunityEntity;

  @RelationId((inviteEntity: InviteEntity) => inviteEntity.community)
  communityId: number;

  @RelationId((inviteEntity: InviteEntity) => inviteEntity.role)
  roleId: number;

  @ManyToOne(() => UserEntity, user => user.id)
  @JoinColumn()
  user: UserEntity;

  @Column()
  inviteAccepted: boolean;
}
