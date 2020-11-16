import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Put,
  Req,
} from '@nestjs/common';

import { EvaluationCriteriaService } from './evaluationCriteria.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { AddEvaluationCriteriaDto, SearchEvaluationCriteriaDto } from './dto';
import { Like } from 'typeorm';
import { OpportunityEvaluationResponseService } from './opportunityEvaluationResponse.service';
import { GetEvaluationResponseDto } from './dto/GetEvaluationResponseDto';
import { PutEvaluationResponseBodyDto } from './dto/PutEvaluationResponseBodyDto';
import { Request } from 'express';
import { EvaluationCriteriaIntegrationService } from './evaluationCriteriaIntegration.service';
import { GetEvaluationIntegrationsDto } from './dto/GetEvaluationIntegrationsDto';
import { GetEvaluationIntegrationsWithResponseDto } from './dto/GetEvaluationIntegrationsWithResponseDto';
import { orderBy, uniqBy } from 'lodash';
import { GetOpportunityEvaluationScoreDto } from './dto/GetOpportunityEvaluationScoreDto';
import { map } from 'lodash';
@Controller('evaluation-criteria')
export class EvaluationCriteriaController {
  constructor(
    private readonly evaluationCriteriaService: EvaluationCriteriaService,
    private readonly opportunityEvaluationResponseService: OpportunityEvaluationResponseService,
    private readonly evaluationCriteriaIntegrationService: EvaluationCriteriaIntegrationService,
  ) {}

  @Post()
  async addEvaluationCriteria(
    @Body() body: AddEvaluationCriteriaDto,
  ): Promise<ResponseFormat> {
    const response = await this.evaluationCriteriaService.addEvaluationCriteria(
      body,
    );
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllEvaluationCriterias(
    @Query() queryParams: SearchEvaluationCriteriaDto,
  ): Promise<ResponseFormat> {
    let whereClause: { community: number; title? } = {
      community: queryParams.community,
    };
    if (queryParams.title) {
      whereClause = { ...whereClause, title: Like(`%${queryParams.title}%`) };
    }
    const options = {
      where: whereClause,
      relations: ['evaluationType'],
    };
    const evaluationCriterias = await this.evaluationCriteriaService.getEvaluationCriterias(
      options,
    );
    return ResponseFormatService.responseOk(evaluationCriterias, 'All');
  }

  @Get('response')
  async getEvaluationResponse(
    @Query() queryparams: GetEvaluationResponseDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const options = {
      relations: [
        'opportunity',
        'evaluationCriteria',
        'evaluationCriteria.evaluationType',
      ],
      where: { ...queryparams, user: req['userData'].id },
    };
    const evalResponse = await this.opportunityEvaluationResponseService.getOpportunityEvaluationResponses(
      options,
    );
    return ResponseFormatService.responseOk(
      evalResponse,
      'Opportunity evaluation reponses.',
    );
  }

  @Put('response')
  async putEvaluationResponse(
    @Query() queryparams: GetEvaluationResponseDto,
    @Body() body: PutEvaluationResponseBodyDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const evalResponse = await this.opportunityEvaluationResponseService.addOrUpdateOppEvaluationResponse(
      { ...queryparams, user: req['userData'].id },
      body.data,
    );
    return ResponseFormatService.responseOk(
      evalResponse,
      'Evaluation reponses added.',
    );
  }

  @Get('opportunity-score')
  async getOpportunityEvaluationScores(
    @Query() queryparams: GetOpportunityEvaluationScoreDto,
  ): Promise<ResponseFormat> {
    const score = await this.evaluationCriteriaService.getOpportunityEvaluationScore(
      queryparams,
    );

    return ResponseFormatService.responseOk(
      score,
      'Opprotunity Evaluation Score',
    );
  }
  @Post('opportunity-score')
  async getOpportunitiesEvaluationScores(@Body()
  body: {
    community: number;
    opportunityIds: [];
  }): Promise<ResponseFormat> {
    const opportunityScorePromiseArr = [];
    map(body.opportunityIds, val => {
      opportunityScorePromiseArr.push(
        this.evaluationCriteriaService.getOpportunityEvaluationScore({
          community: body.community,
          opportunity: val,
          returnOpportunityId: true,
        }),
      );
    });
    const score = await Promise.all(opportunityScorePromiseArr);

    return ResponseFormatService.responseOk(
      score,
      'Opprotunity Evaluation Score',
    );
  }

  @Get('entity-scores')
  async getEvaluationEntityScores(
    @Query() queryparams: GetEvaluationIntegrationsWithResponseDto,
  ): Promise<ResponseFormat> {
    const scores = await this.evaluationCriteriaService.getEvaluationsEntityScores(
      queryparams,
    );

    const responses = await this.opportunityEvaluationResponseService.getOpportunityEvaluationResponses(
      {
        where: queryparams,
      },
    );
    const uniqResp = uniqBy(responses, 'userId');

    return ResponseFormatService.responseOk(
      { ...scores, totalResponses: uniqResp.length },
      'All Evaluation Criterias Entity Scores',
    );
  }
  @Post('entity-scores')
  async getEvaluationEntitiesScores(@Body() body): Promise<ResponseFormat> {
    const dataPromiseArr = [];
    map(body.requestData, res => {
      dataPromiseArr.push(
        this.getDataForEvalScore({
          community: body.community,
          entityObjectId: res.entityObjectId,
          entityType: res.entityType,
          opportunity: res.opportunity,
        }),
      );
    });
    const result = await Promise.all(dataPromiseArr);
    return ResponseFormatService.responseOk(
      result,
      'All Evaluation Criterias Entity Scores',
    );
  }

  @Get('integration')
  async getEvaluationIntegrations(
    @Query() queryparams: GetEvaluationIntegrationsDto,
  ): Promise<ResponseFormat> {
    const entityCriterias = await this.evaluationCriteriaIntegrationService.getEvaluationCriteriaIntegrations(
      {
        relations: ['evaluationCriteria', 'evaluationCriteria.evaluationType'],
        where: queryparams,
        order: { order: 'ASC' },
      },
    );

    return ResponseFormatService.responseOk(
      entityCriterias,
      'All Entity Evaluation Criterias',
    );
  }

  @Get('integration/with-response')
  async getEvaluationIntegrationsWithResponse(
    @Query() queryparams: GetEvaluationIntegrationsWithResponseDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const integrationsWithData = await this.evaluationCriteriaIntegrationService.getEvaluationIntegrationsWithFilters(
      {
        ...queryparams,
        checkOpportunity: true,
        includeResponses: true,
        user: req['userData'].id,
      },
    );

    const excludeCriteriaIds = integrationsWithData.map(
      integration => integration.evaluationCriteriaId,
    );

    const integrationsWithoutData = await this.evaluationCriteriaIntegrationService.getEvaluationIntegrationsWithFilters(
      {
        ...queryparams,
        ...(excludeCriteriaIds.length && { excludeCriteriaIds }),
        includeResponses: false,
        checkOpportunity: false,
        user: req['userData'].id,
      },
    );

    const integrationsData = [
      ...integrationsWithData,
      ...integrationsWithoutData,
    ];
    const integrationsDataSorted = orderBy(integrationsData, 'order', 'asc');

    return ResponseFormatService.responseOk(
      integrationsDataSorted,
      'All Evaluation Criteria Integrations with Data.',
    );
  }

  @Get(':id')
  async getEvaluationCriteria(
    @Param('id') id: string,
  ): Promise<ResponseFormat> {
    const evaluationCriteria = await this.evaluationCriteriaService.getEvaluationCriterias(
      { where: { id: id }, relations: ['evaluationType'] },
    );
    return ResponseFormatService.responseOk(evaluationCriteria, 'All');
  }

  @Patch(':id')
  async updateEvaluationCriteria(
    @Param('id') id: string,
    @Body() body: {},
  ): Promise<ResponseFormat> {
    const updateData = await this.evaluationCriteriaService.updateEvaluationCriteria(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete(':id')
  async removeEvaluationCriteria(
    @Param('id') id: string,
  ): Promise<ResponseFormat> {
    const deleteData = await this.evaluationCriteriaService.deleteEvaluationCriteria(
      {
        id: id,
      },
    );
    return ResponseFormatService.responseOk(deleteData, '');
  }
  @Delete('integration/:id')
  async removeEvaluationCriteriaIntegration(
    @Param('id') id: string,
  ): Promise<ResponseFormat> {
    const deleteData = await this.evaluationCriteriaIntegrationService.deleteEvaluationCriteriaIntegration(
      { id: id },
    );
    return ResponseFormatService.responseOk(deleteData, '');
  }
  async getDataForEvalScore(
    params: GetEvaluationIntegrationsWithResponseDto,
  ): Promise<{}> {
    const scores = await this.evaluationCriteriaService.getEvaluationsEntityScores(
      params,
    );

    const responses = await this.opportunityEvaluationResponseService.getOpportunityEvaluationResponses(
      {
        where: params,
      },
    );
    const uniqResp = uniqBy(responses, 'userId');
    return {
      ...scores,
      totalResponses: uniqResp.length,
      opportunityId: params.opportunity,
    };
  }
}
