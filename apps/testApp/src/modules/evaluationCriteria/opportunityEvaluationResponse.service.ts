import { Injectable } from '@nestjs/common';
import { OpportunityEvaluationResponseRepository } from './opportunityEvaluationResponse.repository';
import { OpportunityEvaluationResponseEntity } from './opportunityEvaluationResponse.entity';

@Injectable()
export class OpportunityEvaluationResponseService {
  constructor(
    public readonly opportunityEvaluationResponseRepository: OpportunityEvaluationResponseRepository,
  ) {}

  /**
   * Get opportunityEvaluationResponses
   */
  async getOpportunityEvaluationResponses(options: {}): Promise<
    OpportunityEvaluationResponseEntity[]
  > {
    return this.opportunityEvaluationResponseRepository.find(options);
  }

  /**
   * Add opportunityEvaluationResponse
   */
  async addOpportunityEvaluationResponse(data: {}): Promise<
    OpportunityEvaluationResponseEntity
  > {
    const opportunityEvaluationResponseCreated = this.opportunityEvaluationResponseRepository.create(
      data,
    );
    return this.opportunityEvaluationResponseRepository.save(
      opportunityEvaluationResponseCreated,
    );
  }

  /**
   * Update or Add Opportunity Evaluation Response
   */
  async addOrUpdateOppEvaluationResponse(
    options: {
      opportunity: number;
      user: number;
      entityObjectId: number;
      entityType: number;
      community: number;
    },
    respData: Array<{
      id: number;
      evaluationCriteria: number;
      criteriaRespData: {};
    }>,
  ): Promise<{}> {
    const addUpdateArray = [];

    for (const resp of respData) {
      if (resp.id) {
        addUpdateArray.push(
          this.updateOpportunityEvaluationResponse({ id: resp.id }, resp),
        );
      } else {
        addUpdateArray.push(
          this.addOpportunityEvaluationResponse({
            ...resp,
            opportunity: options.opportunity,
            entityType: options.entityType,
            entityObjectId: options.entityObjectId,
            user: options.user,
            community: options.community,
          }),
        );
      }
    }

    return Promise.all(addUpdateArray);
  }

  /**
   * Update opportunityEvaluationResponse
   */
  async updateOpportunityEvaluationResponse(
    options: {},
    data: {},
  ): Promise<{}> {
    return this.opportunityEvaluationResponseRepository.update(options, data);
  }

  /**
   * Delete opportunityEvaluationResponse
   */
  async deleteOpportunityEvaluationResponse(options: {}): Promise<{}> {
    return this.opportunityEvaluationResponseRepository.delete(options);
  }
}
