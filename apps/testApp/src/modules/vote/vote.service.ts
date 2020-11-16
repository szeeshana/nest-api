import { Injectable } from '@nestjs/common';
import { VoteRepository } from './vote.repository';
import { VoteEntity } from './vote.entity';
import {
  TABLES,
  ACTION_TYPES,
  ENTITY_TYPES,
  //   ENTITY_TYPES,
} from '../../common/constants/constants';
import { NotificationHookService } from './../../shared/services/notificationHook';
import { CommunityActionPoints } from '../../shared/services/communityActionPoint.service';

@Injectable()
export class VoteService {
  constructor(public readonly VoteRepository: VoteRepository) {}

  async getVoteCounts(
    userId: string,
    entityTypeId?,
    entityObjectIds?,
    community?,
  ): Promise<{}> {
    return this.VoteRepository.createQueryBuilder(TABLES.VOTE)
      .select([
        `${TABLES.VOTE}.entityType`,
        `count(${TABLES.VOTE}.entityType)`,
        `array_agg(${TABLES.VOTE}.entityObjectId) as ids`,
      ])
      .where(`${TABLES.VOTE}.user = :userId`, {
        userId: userId,
      })
      .andWhere(
        community ? `${TABLES.BOOKMARK}.community = :community` : `1=1`,
        {
          community: community,
        },
      )
      .andWhere(
        entityTypeId ? `${TABLES.VOTE}.entityType = :entityType` : `1=1`,
        {
          entityType: entityTypeId,
        },
      )
      .andWhere(
        entityObjectIds
          ? `${TABLES.VOTE}.entityObjectId IN (:...entityObjectIds)`
          : `1=1`,
        {
          entityObjectIds: entityObjectIds,
        },
      )
      .groupBy(`${TABLES.VOTE}.entityType`)
      .getRawMany();
  }
  async getVoteCountsByDate(entityTypeId?, entityObjectIds?): Promise<any[]> {
    return this.VoteRepository.createQueryBuilder(TABLES.VOTE)
      .select([
        `ARRAY_TO_STRING(ARRAY_AGG(DISTINCT CAST(${TABLES.VOTE}.createdAt AS DATE)), ',') AS date`,
        `count(${TABLES.VOTE}.id)::INTEGER`,
        // `ARRAY_AGG(${TABLES.VOTE}.entityObjectId) as ids`,
      ])
      .andWhere(
        entityTypeId ? `${TABLES.VOTE}.entityType = :entityType` : `1=1`,
        {
          entityType: entityTypeId,
        },
      )
      .andWhere(
        entityObjectIds
          ? `${TABLES.VOTE}.entityObjectId IN (:...entityObjectIds)`
          : `1=1`,
        {
          entityObjectIds: entityObjectIds,
        },
      )
      .groupBy(`CAST(${TABLES.VOTE}.createdAt AS DATE)`)
      .getRawMany();
  }
  /**
   * Get All Filtered Votes Rgardless of User
   * @param {object} options
   */
  async getAllVote(options: {}): Promise<VoteEntity[]> {
    return this.VoteRepository.find(options);
  }

  /**
   * Get Vote against User
   */
  async getVoteCount(options: {}): Promise<number> {
    return this.VoteRepository.count(options);
  }
  /**
   * Get Vote against User
   */
  async getVote(options: {}): Promise<VoteEntity[]> {
    return this.VoteRepository.find(options);
  }

  /**
   * Get Type specific Votes against a user under community
   */
  async getTypeVote(options: {
    abbreviation: string;
    entityObjectId: string;
    user: string;
    community: string;
  }): Promise<{}> {
    return this.VoteRepository.createQueryBuilder(TABLES.VOTE)
      .innerJoinAndSelect('vote.entityType', 'entityType')
      .where('entityType.abbreviation = :abbreviation', {
        abbreviation: options.abbreviation,
      })
      .andWhere('vote.entityObjectId = :entityObjectId', {
        entityObjectId: options.entityObjectId,
      })
      .andWhere('vote.user = :user', {
        user: options.user,
      })
      .andWhere('vote.community = :community', {
        community: options.community,
      })
      .getOne();
  }

  /**
   * Add Vote
   */
  async addVote(data: {}, actorData): Promise<VoteEntity> {
    const VoteCreated = this.VoteRepository.create(data);
    const voteAddResponse = await this.VoteRepository.save(VoteCreated);
    const addedVoteData = await this.VoteRepository.findOne({
      where: { id: voteAddResponse.id },
      relations: ['entityType', 'community'],
    });
    let points;
    if (
      addedVoteData.entityType.abbreviation === ENTITY_TYPES.IDEA ||
      addedVoteData.entityType.abbreviation === ENTITY_TYPES.COMMENT
    ) {
      points = await CommunityActionPoints.addUserPoints({
        actionType: ACTION_TYPES.UPVOTE,
        entityTypeId: addedVoteData.entityType.id,
        community: addedVoteData.community.id,
        userId: actorData.id,
        entityType: addedVoteData.entityType.id,
        entityObjectId: addedVoteData.id,
      });
    }
    NotificationHookService.notificationHook({
      actionData: voteAddResponse,
      actorData: actorData,
      actionType: ACTION_TYPES.UPVOTE,
    });
    voteAddResponse['points'] = {
      value: points,
      type: ACTION_TYPES.UPVOTE,
    };
    return voteAddResponse;
  }

  /**
   * Update Vote
   */
  async updateVote(options: {}, data: {}): Promise<{}> {
    return this.VoteRepository.update(options, data);
  }

  /**
   * Delete Vote
   */
  async deleteVote(options: {}): Promise<{}> {
    return this.VoteRepository.delete(options);
  }

  /**
   * Get Type specific Votes against a user under community
   */
  async getTypeVoteCount(entityObjectIds, abbreviation): Promise<{}> {
    return this.VoteRepository.createQueryBuilder(TABLES.VOTE)
      .innerJoinAndSelect('vote.entityType', 'entityType')
      .leftJoinAndSelect('vote.user', 'user')
      .leftJoinAndSelect('user.profileImage', 'profileImage')
      .where('vote.entityObjectId IN (:...entityObjectIds)', {
        entityObjectIds: entityObjectIds,
      })
      .andWhere('entityType.abbreviation = :abbreviation', {
        abbreviation: abbreviation,
      })
      .orderBy('vote.createdAt')
      .getMany();
  }
}
