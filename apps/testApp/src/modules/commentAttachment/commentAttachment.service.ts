import { Injectable } from '@nestjs/common';
import { CommentAttachmentRepository } from './commentAttachment.repository';
import { CommentAttachmentEntity } from './commentAttachment.entity';

@Injectable()
export class CommentAttachmentService {
  constructor(
    public readonly commentAttachmentRepository: CommentAttachmentRepository,
  ) {}

  /**
   * Get commentAttachments
   */
  async getCommentAttachments(options: {}): Promise<CommentAttachmentEntity[]> {
    return this.commentAttachmentRepository.find(options);
  }

  /**
   * Add commentAttachment
   */
  async addCommentAttachment(data: {}): Promise<CommentAttachmentEntity> {
    const commentAttachmentCreated = this.commentAttachmentRepository.create(
      data,
    );
    return this.commentAttachmentRepository.save(commentAttachmentCreated);
  }

  /**
   * Update commentAttachment
   */
  async updateCommentAttachment(options: {}, data: {}): Promise<{}> {
    return this.commentAttachmentRepository.update(options, data);
  }

  /**
   * Delete commentAttachment
   */
  async deleteCommentAttachment(options: {}): Promise<{}> {
    return this.commentAttachmentRepository.delete(options);
  }
}
