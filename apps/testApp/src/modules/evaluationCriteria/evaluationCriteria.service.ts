import { Injectable } from '@nestjs/common';
import { EvaluationCriteriaRepository } from './evaluationCriteria.repository';
import { EvaluationCriteriaEntity } from './evaluationCriteria.entity';
import { EvaluationCriteriaIntegrationEntity } from './evaluationCriteriaIntegration.entity';
import {
  EVALUATION_TYPE_ABBREVIATIONS,
  NORMALIZED_TOTAL_CRITERIA_SCORE,
  NORMALIZED_TOTAL_ENTITY_SCORE,
  ACTION_ITEM_ABBREVIATIONS,
  ENTITY_TYPES,
} from '../../common/constants/constants';
import { NumberCriteriaConfigInterface } from './interface/numberCriteriaConfig.interface';
import { QuestionCriteriaConfigInterface } from './interface/questionCriteriaConfig.interface';
import {
  find,
  minBy,
  maxBy,
  get,
  meanBy,
  countBy,
  sumBy,
  groupBy,
  flatten,
} from 'lodash';
import { CriteriaScoreInterface } from './interface/criteriaScore.interface';
import { EvaluationCriteriaIntegrationService } from './evaluationCriteriaIntegration.service';
import { EntityScoreInterface } from './interface/entityScore.interface';
import { StageHistoryService } from '../stage/stageHistory.service';
import { EntityMetaService } from '../../shared/services/EntityMeta.service';

@Injectable()
export class EvaluationCriteriaService {
  constructor(
    public readonly evaluationCriteriaRepository: EvaluationCriteriaRepository,
    private readonly evaluationCriteriaIntegrationService: EvaluationCriteriaIntegrationService,
    private readonly stageHistoryService: StageHistoryService,
  ) {}

  /**
   * Get evaluationCriterias
   */
  async getEvaluationCriterias(options: {}): Promise<
    EvaluationCriteriaEntity[]
  > {
    return this.evaluationCriteriaRepository.find(options);
  }

  /**
   * Add evaluationCriteria
   */
  async addEvaluationCriteria(data: {}): Promise<EvaluationCriteriaEntity> {
    const evaluationCriteriaCreated = this.evaluationCriteriaRepository.create(
      data,
    );
    return this.evaluationCriteriaRepository.save(evaluationCriteriaCreated);
  }

  /**
   * Update evaluationCriteria
   */
  async updateEvaluationCriteria(options: {}, data: {}): Promise<{}> {
    return this.evaluationCriteriaRepository.update(options, data);
  }

  /**
   * Delete evaluationCriteria
   */
  async deleteEvaluationCriteria(options: {}): Promise<{}> {
    return this.evaluationCriteriaRepository.delete(options);
  }

  /**
   * Calculate Opportunity evaluation score across all attached stages.
   * @param params Opportunity find options for which to calculate the score.
   */
  async getOpportunityEvaluationScore(params: {
    opportunity: number;
    community?: number;
    returnOpportunityId?: boolean;
  }): Promise<{}> {
    // Get opportunity stage history to get all attached stages with the opportunity.
    const stages = await this.stageHistoryService.getStageHistory({
      where: params,
      relations: ['stage', 'stage.actionItem'],
    });
    const evaluationStages = groupBy(stages, 'stage.actionItem.abbreviation')[
      ACTION_ITEM_ABBREVIATIONS.SCORECARD
    ];

    const opportunityScore = {
      totalScore: NORMALIZED_TOTAL_ENTITY_SCORE,
    };

    if (evaluationStages && evaluationStages.length) {
      const stageEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
        ENTITY_TYPES.STAGE,
      );

      // Get all stages scores.
      const stageScores = await Promise.all(
        evaluationStages.map(evalStage =>
          this.getEvaluationsEntityScores({
            entityObjectId: evalStage.stage.id,
            entityType: stageEntityType.id,
            opportunity: params.opportunity,
            community: params.community,
          }),
        ),
      );

      // Get criteria used in all stages and their usage counts.
      const criteriaScores = flatten(
        stageScores.map(score => score.criteriaScores),
      );
      const criteria = criteriaScores.map(critScore => critScore.criteria);
      const criteriaCount = countBy(criteria, 'id');

      let sumCriteriaScore = 0;
      let totalWeights = 0;

      for (const score of criteriaScores) {
        // Scores summed up by mutiplying each with it's weight and adding to the
        // total sum. If a criteria is used more than once, then we calculate its
        // weight by the formula: weight / # times used
        sumCriteriaScore +=
          score.rawNormalizedScore *
          (score.criteria.criteriaWeight / criteriaCount[score.criteria.id]);

        // Sum up total weights.
        totalWeights +=
          score.criteria.criteriaWeight / criteriaCount[score.criteria.id];
      }

      // Normalized score is calculated by dividing the summed score by total wights.
      const rawNormalizedScore = sumCriteriaScore / totalWeights;

      // Final score is normalized from the raw range interval [0, 1] to [0, x].
      // x is given by the constant NORMALIZED_TOTAL_ENTITY_SCORE and defaults
      // to 100.
      opportunityScore['rawNormalizedScore'] = rawNormalizedScore;
      opportunityScore['finalScore'] =
        rawNormalizedScore * NORMALIZED_TOTAL_ENTITY_SCORE;
    }
    if (params.returnOpportunityId) {
      return { opportunityId: params.opportunity, opportunityScore };
    }

    return opportunityScore;
  }

  /**
   * Calculate Entity scores on integrated criteria.
   * @param params Integrated criteria on which to calculate response scores.
   */
  async getEvaluationsEntityScores(params: {
    entityObjectId: number;
    entityType: number;
    opportunity: number;
    community?: number;
  }): Promise<EntityScoreInterface> {
    // Get criteria with responses.
    const criteria = await this.evaluationCriteriaIntegrationService.getEvaluationIntegrationWithResponses(
      params,
    );

    // Calculate criteria scores.
    const criteriaScores = this.getEvaluationsResponseScores({ criteria });

    // Calculate opportunity score by entity.
    const sumCriteriaScore = sumBy(
      criteriaScores,
      score => score.rawNormalizedScore * score.criteria.criteriaWeight,
    );
    const totalWeights = sumBy(criteriaScores, 'criteria.criteriaWeight');

    const rawNormalizedScore = sumCriteriaScore / totalWeights;

    const entityScore = {
      rawNormalizedScore,
      finalScore: rawNormalizedScore * NORMALIZED_TOTAL_ENTITY_SCORE,
      totalNormalizedScore: NORMALIZED_TOTAL_ENTITY_SCORE,
    };

    return { criteriaScores, entityScore };
  }

  /**
   * Calculate response scores on integrated criteria.
   * @param params Integrated criteria on which to calculate response scores.
   */
  getEvaluationsResponseScores(params: {
    criteria: EvaluationCriteriaIntegrationEntity[];
  }): Array<CriteriaScoreInterface> {
    const criteriaScores = params.criteria.map(integCriteria => {
      const evalCriteria = integCriteria.evaluationCriteria;
      const responses = evalCriteria.oppEvaluationResponse || [];

      // Removing responses to reduce object size.
      delete evalCriteria.oppEvaluationResponse;

      const score = {
        criteria: evalCriteria,
        maxScore: 0,
        minScore: 0,
        avgScore: 0,
        avgNormalizedScore: 0,
        rawNormalizedScore: 0,
        totalNormalizedScore: NORMALIZED_TOTAL_CRITERIA_SCORE,
        totalResponses: responses.length,
      };

      if (
        evalCriteria.evaluationType.abbreviation ==
        EVALUATION_TYPE_ABBREVIATIONS.NUMBER
      ) {
        // In case of number type criteria.
        const criteriaConfig = evalCriteria.criteriaObject as NumberCriteriaConfigInterface;
        score.maxScore = criteriaConfig.maxValue;
        score.minScore = criteriaConfig.minValue;
        score.avgScore = responses.length
          ? meanBy(responses, 'criteriaRespData.selected')
          : 0;

        // Normalizing numerical score.
        score.rawNormalizedScore =
          (criteriaConfig.higherBest
            ? score.avgScore
            : score.maxScore - score.avgScore) / score.maxScore;
      } else {
        // In case of question type criteria.
        const criteriaConfig = evalCriteria.criteriaObject as QuestionCriteriaConfigInterface;
        score.maxScore = maxBy(criteriaConfig.data, 'value').value;
        score.minScore = minBy(criteriaConfig.data, 'value').value;
        score.avgScore = responses.length
          ? meanBy(
              responses,
              resp =>
                find(criteriaConfig.data, [
                  'key',
                  get(resp.criteriaRespData, 'selected', ''),
                ]).value,
            )
          : 0;

        // Finding most selected response.
        if (responses.length) {
          score['responseDistribution'] = countBy(
            responses,
            'criteriaRespData.selected',
          );
        }

        // Normalizing question score.
        score.rawNormalizedScore = score.avgScore / score.maxScore;
      }

      score.avgNormalizedScore =
        score.rawNormalizedScore * score.totalNormalizedScore;
      return score;
    });

    return criteriaScores;
  }
}
