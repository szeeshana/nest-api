import { CommonEntity } from '../../common/common.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
  OneToMany,
} from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { PrizeCategoryEntity } from './prizeCategory.entity';
import { CommunityEntity } from '../community/community.entity';
import { ChallengeEntity } from '../challenge/challenge.entity';
import { PrizeAwardeeEntity } from './prizeAwardee.entity';

@Entity(TABLES.PRIZE)
export class PrizeEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 250 })
  title: string;

  @Column({ nullable: true, type: 'varchar', length: 2000 })
  description: string;

  @Column({ nullable: true, type: 'varchar', length: 2000 })
  image: string;

  @Column({
    type: 'int8',
    default: 0,
  })
  totalWinners: number;

  @Column({
    nullable: true,
    type: 'int8',
  })
  prizeValue: number;

  @Column({
    default: false,
  })
  isRedeemable: boolean;

  @Column({
    type: 'int8',
    default: 0,
  })
  redeemPoints: number;

  @ManyToOne(() => ChallengeEntity)
  @JoinColumn()
  challenge: ChallengeEntity;

  @RelationId((prize: PrizeEntity) => prize.challenge)
  challengeId: number;

  @ManyToOne(() => PrizeCategoryEntity)
  @JoinColumn()
  category: PrizeCategoryEntity;

  @RelationId((prize: PrizeEntity) => prize.category)
  categoryId: number;

  @ManyToOne(() => CommunityEntity)
  @JoinColumn()
  community: CommunityEntity;

  @RelationId((prize: PrizeEntity) => prize.community)
  communityId: number;

  @OneToMany(() => PrizeAwardeeEntity, awardee => awardee.prize)
  awardees: PrizeAwardeeEntity[];
}
