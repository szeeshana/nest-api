import { Injectable } from '@nestjs/common';

import { CommentThreadEntity } from './commentThread.entity';
import { CommentThreadRepository } from './commentThread.repository';

@Injectable()
export class CommentThreadService {
  constructor(
    public readonly commentThreadRepository: CommentThreadRepository,
  ) {}

  /**
   * Get commentThreads
   */
  async getCommentThreads(options: {}): Promise<CommentThreadEntity[]> {
    return this.commentThreadRepository.find(options);
  }

  /**
   * Get commentThreads
   */
  async findCommentThreads(
    community,
    entityObjectId,
  ): Promise<CommentThreadEntity[]> {
    return this.commentThreadRepository
      .createQueryBuilder('comment_thread')
      .leftJoinAndSelect('comment_thread.entityType', 'entityType')
      .leftJoinAndSelect('comment_thread.comment', 'commentThreadComment')
      .leftJoinAndSelect(
        'commentThreadComment.commentAttachments',
        'commentThreadCommentAttachments',
      )
      .leftJoinAndSelect(
        'commentThreadCommentAttachments.userAttachment',
        'commentThreadCommentUserAttachment',
      )
      .leftJoinAndSelect('comment_thread.user', 'user')
      .leftJoinAndSelect('user.profileImage', 'profileImage')
      .leftJoinAndSelect('comment_thread.community', 'community')

      .leftJoinAndSelect(
        'comment_thread.commentThreadPerticipants',
        'commentThreadPerticipants',
      )
      .leftJoinAndSelect('commentThreadPerticipants.comment', 'comment')
      .leftJoinAndSelect(
        'comment.commentAttachments',
        'commentThreadPerticipantsAttachment',
      )
      .leftJoinAndSelect('comment.user', 'commentThreadPerticipantsUser')
      .leftJoinAndSelect(
        'commentThreadPerticipantsUser.profileImage',
        'commentThreadPerticipantsUserProfileImage',
      )
      .leftJoinAndSelect('comment.commentAttachments', 'commentAttachments')
      .leftJoinAndSelect('commentAttachments.userAttachment', 'userAttachment')
      .where('comment_thread.community = :community', {
        community: community,
      })
      .andWhere('comment_thread.entityObjectId = :entityObjectId', {
        entityObjectId: entityObjectId,
      })
      .orderBy({
        'comment_thread.createdAt': 'DESC',
        'commentThreadPerticipants.createdAt': 'ASC',
      })
      .getMany();
  }

  /**
   * Add commentThread
   */
  async addCommentThread(data: {}): Promise<CommentThreadEntity> {
    const commentThreadCreated = this.commentThreadRepository.create(data);
    return this.commentThreadRepository.save(commentThreadCreated);
  }

  /**
   * Update commentThread
   */
  async updateCommentThread(options: {}, data: {}): Promise<{}> {
    return this.commentThreadRepository.update(options, data);
  }

  /**
   * Delete commentThread
   */
  async deleteCommentThread(options: {}): Promise<{}> {
    return this.commentThreadRepository.delete(options);
  }
}
