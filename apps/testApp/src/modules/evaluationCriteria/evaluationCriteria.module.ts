import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationCriteriaRepository } from './evaluationCriteria.repository';
import { EvaluationCriteriaController } from './evaluationCriteria.controller';
import { EvaluationCriteriaService } from './evaluationCriteria.service';
import { EvaluationTypeRepository } from './evaluationType.repository';
import { EvaluationTypeController } from './evaluationType.controller';
import { EvaluationTypeService } from './evaluationType.service';
import { OpportunityEvaluationResponseService } from './opportunityEvaluationResponse.service';
import { OpportunityEvaluationResponseRepository } from './opportunityEvaluationResponse.repository';
import { EvaluationCriteriaIntegrationService } from './evaluationCriteriaIntegration.service';
import { EvaluationCriteriaIntegrationRepository } from './evaluationCriteriaIntegration.repository';
import { StageHistoryService } from '../stage/stageHistory.service';
import { StageHistoryRepository } from '../stage/stageHistory.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationTypeRepository,
      EvaluationCriteriaRepository,
      EvaluationCriteriaIntegrationRepository,
      OpportunityEvaluationResponseRepository,
      StageHistoryRepository,
    ]),
  ],
  controllers: [EvaluationCriteriaController, EvaluationTypeController],
  exports: [
    EvaluationTypeService,
    EvaluationCriteriaService,
    EvaluationCriteriaIntegrationService,
    OpportunityEvaluationResponseService,
  ],
  providers: [
    EvaluationTypeService,
    EvaluationCriteriaService,
    EvaluationCriteriaIntegrationService,
    OpportunityEvaluationResponseService,
    StageHistoryService,
  ],
})
export class EvaluationCriteriaModule {}
