import { Injectable } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { CommentEntity } from './comment.entity';
import {
  ACTION_TYPES,
  ENTITY_TYPES,
  TABLES,
  MENTION_TYPES,
} from '../../common/constants/constants';
import { NotificationHookService } from '../../shared/services/notificationHook';
import { CommunityActionPoints } from '../../shared/services/communityActionPoint.service';
import { In } from 'typeorm';
import { EntityMetaService } from '../../shared/services/EntityMeta.service';
import { MentionService } from '../mention/mention.service';

@Injectable()
export class CommentService {
  constructor(
    public readonly commentRepository: CommentRepository,
    public readonly mentionService: MentionService,
  ) {}

  /**
   * Get comments
   */
  async getCommentCount(options: {}): Promise<number> {
    return this.commentRepository.count(options);
  }
  /**
   * Get comments
   */
  async getComments(options: {}): Promise<CommentEntity[]> {
    return this.commentRepository.find(options);
  }

  /**
   * Add comment
   */
  async addComment(data: {}, actorData, isReply): Promise<CommentEntity> {
    const mentions = data['mentions'] || [];
    data['mentions'] = [];

    const commentData = this.commentRepository.create(data);
    const saveComment = await this.commentRepository.save(commentData);

    const commentEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.COMMENT,
    );

    // add mentions
    let addedMentions = [];
    if (mentions.length) {
      mentions.map(async mention => {
        mention['entityObjectId'] = saveComment.id;
        mention['entityType'] = commentEntityType.id;
        mention['community'] = actorData['community'];
      });
      addedMentions = await this.mentionService.bulkAddMentions(mentions);

      const addedMentionsIds = addedMentions.map(mention => mention.id);
      await this.commentRepository.update(
        { id: saveComment.id },
        { mentions: addedMentionsIds },
      );
      saveComment.mentions = addedMentionsIds;
    }

    const commentAddedData = await this.commentRepository.findOne({
      where: { id: saveComment.id },
      relations: ['entityType', 'commentThread', 'commentThread.community'],
    });

    NotificationHookService.notificationHook({
      actionData: saveComment,
      actorData: commentAddedData.anonymous
        ? { ...actorData, firstName: 'Anonymous' }
        : actorData,
      actionType: ACTION_TYPES.COMMENT,
      entityOperendObject: { comment: commentAddedData },
    });

    // Generate notifications for mentions (only user mentions being handled right now).
    if (saveComment.mentions.length) {
      this.mentionService.generateNotifications({
        actionData: {
          ...commentAddedData,
          entityType: commentAddedData.entityType.id,
        },
        actorData: commentAddedData.anonymous
          ? { ...actorData, firstName: 'Anonymous' }
          : actorData,
        mentions: addedMentions,
        mentionType: MENTION_TYPES.COMMENT,
        mentionEntity: commentAddedData,
      });
    }

    const points = await CommunityActionPoints.addUserPoints({
      actionType: isReply ? ACTION_TYPES.COMMENT : ACTION_TYPES.POST,
      entityTypeName: ENTITY_TYPES.COMMENT,
      community: actorData.community,
      userId: actorData.id,
      entityType: commentAddedData.entityType.id,
      entityObjectId: commentAddedData.entityObjectId,
    });
    saveComment['points'] = {
      value: points,
      type: ACTION_TYPES.COMMENT,
    };
    return saveComment;
  }

  /**
   * Update comment
   */
  async updateComment(options: {}, data: {}, actorData: {}): Promise<{}> {
    const mentions = data['mentions'] || [];

    const existingComment = await this.commentRepository.findOne({
      where: { ...options },
      relations: ['entityType'],
    });
    const existingMentions =
      existingComment.mentions && existingComment.mentions.length
        ? await this.mentionService.getMentions({
            where: { id: In(existingComment.mentions) },
          })
        : [];
    const commentEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.COMMENT,
    );
    const entityData = await EntityMetaService.getEntityObjectByEntityType(
      existingComment.entityType.entityTable,
      existingComment.entityObjectId,
    );

    let addedMentions = [];
    if (data['mentions']) {
      // remove existing mentions
      if (existingComment.mentions && existingComment.mentions.length) {
        await this.mentionService.removeMention(
          existingComment.mentions.map(mention => ({ id: mention })),
        );
      }

      // add new mentions
      mentions.map(async mention => {
        mention['entityObjectId'] = existingComment.id;
        mention['entityType'] = commentEntityType.id;
        mention['community'] = entityData['communityId'];
        delete mention['id'];
        delete mention['createdAt'];
        delete mention['updatedAt'];
      });
      addedMentions = await this.mentionService.bulkAddMentions(mentions);
      data['mentions'] = addedMentions.map(mention => mention.id);
    }

    const updateData = this.commentRepository.update(options, data);

    const updatedComment = await this.commentRepository.findOne({
      where: { ...options },
      relations: ['entityType'],
    });

    // Generate notifications for mentions.
    actorData['community'] = entityData['communityId'];
    if (addedMentions && addedMentions.length) {
      const newMentions = this.mentionService.diffMentions(
        addedMentions,
        existingMentions,
      );
      if (newMentions && newMentions.length) {
        this.mentionService.generateNotifications({
          actionData: {
            ...updatedComment,
            entityType: updatedComment.entityType.id,
          },
          actorData: updatedComment.anonymous
            ? { ...actorData, firstName: 'Anonymous' }
            : actorData,
          mentions: addedMentions,
          mentionType: MENTION_TYPES.COMMENT,
          mentionEntity: updatedComment,
        });
      }
    }

    return updateData;
  }

  /**
   * Delete comment
   */
  async deleteComment(options: {}): Promise<{}> {
    return this.commentRepository.delete(options);
  }
  async getCommentCountsByDate(
    entityTypeId?,
    entityObjectIds?,
  ): Promise<any[]> {
    return this.commentRepository
      .createQueryBuilder(TABLES.COMMENT)
      .select([
        `ARRAY_TO_STRING(ARRAY_AGG(DISTINCT CAST(${TABLES.COMMENT}.createdAt AS DATE)), ',') AS date`,
        `count(${TABLES.COMMENT}.id)::INTEGER`,
        // `ARRAY_AGG(${TABLES.COMMENT}.entityObjectId) as ids`,
      ])
      .andWhere(
        entityTypeId ? `${TABLES.COMMENT}.entityType = :entityType` : `1=1`,
        {
          entityType: entityTypeId,
        },
      )
      .andWhere(
        entityObjectIds
          ? `${TABLES.COMMENT}.entityObjectId IN (:...entityObjectIds)`
          : `1=1`,
        {
          entityObjectIds: entityObjectIds,
        },
      )
      .groupBy(`CAST(${TABLES.COMMENT}.createdAt AS DATE)`)
      .getRawMany();
  }
}
