import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';

import { WorkflowService } from './workflow.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { AddWorkflowDto } from './dto/AddWorkflowDto';
import { GetCommunityWorkflowDto } from './dto/GetCommunityWorkflowDto';
import { GetWorkflowStageDto } from './dto/GetWorkflowStageDto';
import { AddStageDto } from './dto/AddStageDto';
import { UpdateStageOrderDto } from './dto/UpdateStageOrderDto';
import { GetStagePotentialAssigneesCountDto } from './dto/GetStagePotentialAssigneesCountDto';
import { GetStageSettingsDto } from './dto/GetStageDto';
import { StageService } from '../stage/stage.service';
import { GetCommunityWorkflowsWithCountsDto } from './dto/GetCommunityWorkflowsWithCountsDto';
import { GetStagesSettingsDetailsDto } from './dto/GetStagesSettingsDetailsDto';

@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    public readonly stageService: StageService,
  ) {}

  @Post('stage')
  async addStage(@Body() body: AddStageDto): Promise<ResponseFormat> {
    const response = await this.stageService.addStage(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Post()
  async addWorkflow(@Body() body: AddWorkflowDto): Promise<ResponseFormat> {
    const response = await this.workflowService.addWorkflow(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get('stage')
  async getWorkflowStages(
    @Query() queryParams: GetWorkflowStageDto,
  ): Promise<ResponseFormat> {
    const withCounts = queryParams.withCounts || false;
    const challenge = queryParams.challenge;
    delete queryParams.withCounts;
    delete queryParams.challenge;

    const options = {
      where: { ...queryParams },
      order: { orderNumber: 'ASC' },
      relations: ['status', 'actionItem'],
    };

    let stages;
    if (!withCounts) {
      stages = await this.stageService.getStages(options);
    } else {
      stages = await this.stageService.getStagesWithCounts({
        ...options,
        challenge,
      });
    }
    return ResponseFormatService.responseOk(stages, 'All');
  }

  @Get()
  async getCommunityWorkflows(
    @Query() queryParams: GetCommunityWorkflowDto,
  ): Promise<ResponseFormat> {
    const options = { where: { ...queryParams } };
    const workflows = await this.workflowService.getWorkflows(options);
    return ResponseFormatService.responseOk(workflows, 'All');
  }

  @Get('next-status/:id')
  async getNextStatus(@Param('id') id): Promise<ResponseFormat> {
    const status = await this.workflowService.getNextStatus({ workflowId: id });
    return ResponseFormatService.responseOk(status, 'All');
  }

  @Get('workflows-with-counts')
  async getWorkflowsWithCounts(
    @Query() queryParams: GetCommunityWorkflowsWithCountsDto,
  ): Promise<ResponseFormat> {
    const options = {
      where: {
        community: queryParams.community,
        isDeleted: queryParams.isDeleted,
      },
      forFilter: queryParams.forFilter,
      challenge: queryParams.challenge,
    };
    const workflows = await this.workflowService.getWorkflowsWithCounts(
      options,
    );
    return ResponseFormatService.responseOk(workflows, 'All');
  }

  @Get('stage/potential-assignees-count')
  async getStagePotentialAssigneesCount(
    @Query() queryParams: GetStagePotentialAssigneesCountDto,
  ): Promise<ResponseFormat> {
    const stage = await this.stageService.getStagePotentialAssigneesCount(
      queryParams,
    );
    return ResponseFormatService.responseOk(stage, 'Potential Assignees Count');
  }

  @Get('stage/notifiable-users-count')
  async getNotifiableUsersCount(
    @Query() queryParams: GetStagePotentialAssigneesCountDto,
  ): Promise<ResponseFormat> {
    const stage = await this.stageService.getNotifiableUsersCount(queryParams);
    return ResponseFormatService.responseOk(stage, 'Notifiable Users Count');
  }

  @Get('stage/stage-settings')
  async getStageSettings(
    @Query() queryParams: GetStageSettingsDto,
  ): Promise<ResponseFormat> {
    const settings = await this.stageService.getStageSettings(queryParams);
    return ResponseFormatService.responseOk(settings, 'All');
  }

  @Get('stage/list-settings-details')
  async getStageListSettingsDetails(
    @Query() queryParams: GetStagesSettingsDetailsDto,
  ): Promise<ResponseFormat> {
    const stages = await this.stageService.getStages({
      where: {
        ...(queryParams.workflow && { workflow: queryParams.workflow }),
        ...(queryParams.stage && { id: queryParams.stage }),
        isDeleted: queryParams.isDeleted || false,
      },
      order: {
        orderNumber: 'ASC',
      },
    });

    let settings = [];
    if (stages.length) {
      settings = await this.stageService.getStagesSettingsDetails(stages);
    }
    return ResponseFormatService.responseOk(
      settings,
      'Settings and details for the stages of given workflow.',
    );
  }

  @Get('stage/:id')
  async getStage(@Param('id') id: number): Promise<ResponseFormat> {
    const stage = await this.stageService.getOneStage({
      where: { id },
      relations: ['status', 'actionItem'],
    });
    return ResponseFormatService.responseOk(stage, 'All');
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: number): Promise<ResponseFormat> {
    const workflow = await this.workflowService.getOneWorkflow({ id: id });
    return ResponseFormatService.responseOk(workflow, 'All');
  }

  @Patch('stage/update-order')
  async updateStagesOrder(
    @Body() body: UpdateStageOrderDto,
  ): Promise<ResponseFormat> {
    const updateData = await this.stageService.updateStagesOrder(body);
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Patch('stage/:id')
  async updateStage(
    @Param('id') id: number,
    @Body() body: AddStageDto,
  ): Promise<ResponseFormat> {
    const updateData = await this.stageService.updateStage({ id: id }, body);
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Patch(':id')
  async updateWorkflow(
    @Param('id') id: number,
    @Body() body: AddWorkflowDto,
  ): Promise<ResponseFormat> {
    const updateData = await this.workflowService.updateWorkflow(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete('stage/:id')
  async removeStage(@Param('id') id: number): Promise<ResponseFormat> {
    const deleteData = await this.stageService.deleteStage({
      id: id,
    });
    return ResponseFormatService.responseOk(deleteData, '');
  }

  @Delete(':id')
  async removeWorkflow(@Param('id') id: number): Promise<ResponseFormat> {
    const deleteData = await this.workflowService.deleteWorkflow({ id: id });
    return ResponseFormatService.responseOk(deleteData, '');
  }
}
