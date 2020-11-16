import { Injectable } from '@nestjs/common';
import { OpportunityAttachmentRepository } from './opportunityAttachment.repository';
import { OpportunityAttachmentEntity } from './opportunityAttachment.entity';

@Injectable()
export class OpportunityAttachmentService {
  constructor(
    public readonly opportunityAttachmentRepository: OpportunityAttachmentRepository,
  ) {}

  /**
   * Get opportunityAttachments
   */
  async getOpportunityAttachments(options: {}): Promise<
    OpportunityAttachmentEntity[]
  > {
    return this.opportunityAttachmentRepository.find(options);
  }

  /**
   * Add opportunityAttachment
   */
  async addOpportunityAttachment(data: {}): Promise<
    OpportunityAttachmentEntity
  > {
    const opportunityAttachmentCreated = this.opportunityAttachmentRepository.create(
      data,
    );
    return this.opportunityAttachmentRepository.save(
      opportunityAttachmentCreated,
    );
  }

  /**
   * Update opportunityAttachment
   */
  async updateOpportunityAttachment(options: {}, data: {}): Promise<{}> {
    return this.opportunityAttachmentRepository.update(options, data);
  }

  /**
   * Delete opportunityAttachment
   */
  async deleteOpportunityAttachment(options: {}): Promise<{}> {
    return this.opportunityAttachmentRepository.delete(options);
  }
}
