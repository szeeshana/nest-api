import { Injectable } from '@nestjs/common';
import { TABLES, ACTION_TYPES } from '../../common/constants/constants';
import { FollowingContentRepository } from './followingContent.repository';

import { FollowingContentEntity } from './followingContent.entity';
import { getRepository } from 'typeorm';
import { UserFollowingContents } from './user.followingContent.entity';
import { NotificationHookService } from '../../shared/services/notificationHook';

@Injectable()
export class FollowingContentService {
  constructor(
    public readonly followingContentRepository: FollowingContentRepository,
  ) {}

  /**
   * Get FollowingContents
   */
  async getFollowingContents(options: {}): Promise<FollowingContentEntity[]> {
    return this.followingContentRepository.find(options);
  }

  /**
   * Get user's follow's content
   * @param {string} user User id
   * @returns List of follow's content
   */
  async getUserFollows(userId: string): Promise<{}> {
    return this.followingContentRepository
      .createQueryBuilder(TABLES.FOLLOWING_CONTENT)
      .innerJoinAndSelect(
        `${TABLES.FOLLOWING_CONTENT}.userFollowingContents`,
        'userFollowingContents',
      )
      .innerJoinAndSelect(
        `${TABLES.FOLLOWING_CONTENT}.entityType`,
        'entityType',
      )
      .where('userFollowingContents.userId=:user', { user: userId })
      .getMany();
  }

  /**
   * Get follows by entity type
   * @param {Object} Opetions User id and entityTypeId
   * @returns List of follows entities wise against a user
   */
  async getUserFollowsByEntityType(options: {
    entityTypeId: string;
    userId: string;
  }): Promise<{}> {
    return this.followingContentRepository
      .createQueryBuilder(TABLES.FOLLOWING_CONTENT)
      .leftJoinAndSelect(
        `${TABLES.FOLLOWING_CONTENT}.userFollowingContents`,
        'userFollowingContents',
      )
      .innerJoinAndSelect(
        `${TABLES.FOLLOWING_CONTENT}.entityType`,
        'entityType',
      )
      .where(`${TABLES.FOLLOWING_CONTENT}.entityType = :entityTypeId`, {
        entityTypeId: options.entityTypeId,
      })
      .andWhere('userFollowingContents.user = :userId', {
        userId: options.userId,
      })
      .getMany();
  }

  /**
   * Get follow counts entity wise
   * @param {Object} Opetions User id and entityTypeId
   * @returns follow counts
   */
  async getFollowingCounts(
    userId: string,
    entityTypeId?,
    entityObjectIds?,
    community?,
  ): Promise<{}> {
    return this.followingContentRepository
      .createQueryBuilder(TABLES.FOLLOWING_CONTENT)
      .select([
        `${TABLES.FOLLOWING_CONTENT}.entityType`,
        `count(${TABLES.FOLLOWING_CONTENT}.entityType)`,
        `array_agg(${TABLES.FOLLOWING_CONTENT}.entityObjectId) as ids`,
      ])
      .leftJoin(
        `${TABLES.FOLLOWING_CONTENT}.userFollowingContents`,
        'userFollowingContents',
      )
      .where('userFollowingContents.user = :userId', {
        userId: userId,
      })
      .andWhere(
        community ? `${TABLES.BOOKMARK}.community = :community` : `1=1`,
        {
          community: community,
        },
      )
      .andWhere(
        entityTypeId
          ? `${TABLES.FOLLOWING_CONTENT}.entityType = :entityType`
          : `1=1`,
        {
          entityType: entityTypeId,
        },
      )
      .andWhere(
        entityObjectIds
          ? `${TABLES.FOLLOWING_CONTENT}.entityObjectId IN (:...entityObjectIds)`
          : `1=1`,
        {
          entityObjectIds: entityObjectIds,
        },
      )
      .groupBy(`${TABLES.FOLLOWING_CONTENT}.entityType`)
      .getRawMany();
  }

  /**
   * Add FollowingContent
   */
  async addFollowingContent(data: {}): Promise<FollowingContentEntity> {
    const FollowingContentCreated = this.followingContentRepository.create(
      data,
    );
    return this.followingContentRepository.save(FollowingContentCreated);
  }

  async addUserFollowingContent(actorData, followingContentId): Promise<void> {
    const userFollowingContentsRepo = getRepository(UserFollowingContents);
    const createdData = await userFollowingContentsRepo.create({
      userId: actorData.id,
      followingContentId: followingContentId,
    });
    const savedUserFollowingData = await userFollowingContentsRepo.save(
      createdData,
    );
    const dataForFollowingContentDetail: UserFollowingContents = await userFollowingContentsRepo.findOne(
      {
        relations: ['followingContent', 'followingContent.entityType'],
        where: {
          followingContentId: savedUserFollowingData.followingContentId,
        },
      },
    );

    NotificationHookService.notificationHook({
      actionData: {
        entityType:
          dataForFollowingContentDetail.followingContent.entityType.id,
        entityObjectId:
          dataForFollowingContentDetail.followingContent.entityObjectId,
      },
      actorData: actorData,
      actionType: ACTION_TYPES.FOLLOW,
    });
  }

  /**
   * Update FollowingContent
   */
  async updateFollowingContent(options: {}, data: {}): Promise<{}> {
    return this.followingContentRepository.update(options, data);
  }

  /**
   * Delete FollowingContent
   */
  async deleteFollowingContent(options: {}): Promise<{}> {
    return this.followingContentRepository.delete(options);
  }

  /**
   * Get
   */
  async getUserFollowByEntityObjectId(
    entityType: number,
    entityObjectId,
    userId,
  ): Promise<{}> {
    return this.followingContentRepository
      .createQueryBuilder('following_content')
      .leftJoinAndSelect(
        'following_content.userFollowingContents',
        'userFollowingContents',
      )
      .where('following_content.entityObjectId = :entityObjectId', {
        entityObjectId: entityObjectId,
      })
      .andWhere('following_content.entityType = :entityType', {
        entityType: entityType,
      })
      .andWhere('userFollowingContents.user = :userId', {
        userId: userId,
      })
      .getMany();
  }
  /**
   * Get for Multiple Entities
   */
  async getUserFollowByEntityObjectIds(
    entityObjectIds,
    userId,
    entityType?: number,
  ): Promise<{}> {
    return this.followingContentRepository
      .createQueryBuilder('following_content')
      .leftJoinAndSelect(
        'following_content.userFollowingContents',
        'userFollowingContents',
      )
      .where('following_content.entityObjectId IN (:...entityObjectIds)', {
        entityObjectIds: entityObjectIds,
      })
      .andWhere('userFollowingContents.user = :userId', {
        userId: userId,
      })
      .andWhere(
        entityType ? 'following_content.entityType = :entityType' : '1=1',
        {
          entityType: entityType,
        },
      )
      .getMany();
  }
  /**
   * Get
   */
  async getFollowByEntityByEntityObjectId(
    entityObjectIds,
    entityType: number,
  ): Promise<{}[]> {
    return this.followingContentRepository
      .createQueryBuilder('following_content')
      .leftJoinAndSelect(
        'following_content.userFollowingContents',
        'userFollowingContents',
      )
      .leftJoinAndSelect('userFollowingContents.user', 'user')
      .leftJoinAndSelect('user.profileImage', 'profileImage')
      .where('following_content.entityObjectId IN (:...entityObjectIds)', {
        entityObjectIds: entityObjectIds,
      })
      .andWhere('following_content.entityType = :entityType', {
        entityType: entityType,
      })
      .getMany();
  }
}
