import { CommonEntity } from '../../common/common.entity';
import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  RelationId,
  Index,
} from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { CommunityEntity } from '../community/community.entity';
import { PageTypeEnum } from '../../enum/page-type.enum';
import { UserEntity } from '../user/user.entity';

@Entity(TABLES.FILTER_OPTION)
export class FilterOptionEntity extends CommonEntity {
  @Column({
    type: 'enum',
    enum: PageTypeEnum,
    default: PageTypeEnum.CARD,
  })
  pageType: PageTypeEnum;

  @Column({ nullable: true, type: 'json' })
  optionsData: {};

  @Index()
  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @RelationId((filterOption: FilterOptionEntity) => filterOption.user)
  userId: number;

  @Index()
  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;

  @RelationId((filterOption: FilterOptionEntity) => filterOption.community)
  communityId: number;
}
