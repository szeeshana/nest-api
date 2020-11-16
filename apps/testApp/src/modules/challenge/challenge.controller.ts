import { Request } from 'express';
import * as _ from 'lodash';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { GetImageUploadUrl } from '../../common/dto/GetImageUploadUrl';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ChallengeAttachmentService } from '../challengeAttachment/challengeAttachment.service';
import { ChallengeService } from './challenge.service';
import { AddChallengeDto, GetChallengeDto, ChallengeStatusUpdate } from './dto';
import { EditChallengeDto } from './dto/EditChallengeDto';
import { IncreaseViewCountChallengeDto } from './dto/IncreaseViewCountChallengeDto';
import { EntityExperienceSettingService } from '../entityExperienceSetting/entityExperienceSetting.service';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorators/permissions.decorator';
import { RoleLevelEnum } from '../../enum/role-level.enum';
import { PERMISSIONS_KEYS } from '../../common/constants/constants';
import { PermissionsCondition } from '../../enum/permissions-condition.enum';
import { RequestPermissionsKey } from '../../enum/request-permissions-key.enum';
import { GetPostOpportunityPermissionsDto } from './dto/GetPostOpportunityPermissionsDto';

@Controller('challenge')
@UseGuards(PermissionsGuard)
export class ChallengeController {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly challengeAttachmentService: ChallengeAttachmentService,
    // private readonly opportunityService: OpportunityService,
    private readonly awsS3Service: AwsS3Service,
    public readonly entityExperienceSettingService: EntityExperienceSettingService,
  ) {}

  @Post()
  async addChallenge(@Body() body: AddChallengeDto): Promise<ResponseFormat> {
    if (body.sponsors && body.sponsors.length === 0) {
      return ResponseFormatService.responseBadRequest(
        [],
        'There must be atleast 1 sponsor.',
      );
    }

    body.isDeleted = false;
    const response = await this.challengeService.addChallenge(body);
    if (body.attachments && body.attachments.length) {
      const newAttachmentsData = [];
      _.map(
        body.attachments,
        (
          val: {
            url: string;
            attachmentType: string;
            isSelected: number;
            size: number;
            userAttachment: string;
          },
          _key,
        ) => {
          newAttachmentsData.push({
            url: val.url,
            attachmentType: val.attachmentType,
            isSelected: val.isSelected,
            challenge: response.id,
            isDeleted: false,
            size: val.size,
            userAttachment: val.userAttachment,
          });
        },
      );
      await this.challengeAttachmentService.addChallengeAttachment(
        newAttachmentsData,
      );
    }
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllChallenges(
    @Query() queryparams: GetChallengeDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const options = {
      where: {
        community: queryparams.community,
        isDeleted: queryparams.isDeleted,
        status: queryparams.status,
      },
      opportunityData: true,
      userId: req['userData'].id,
    };
    const challenges = await this.challengeService.searchChallenges(options);
    return ResponseFormatService.responseOk(challenges, 'All');
  }

  @Get('permissions')
  async getPermissions(
    @Query('id') id,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const permissions = await this.challengeService.getPermissions(
      id,
      req['userData'].id,
    );
    return ResponseFormatService.responseOk(permissions, 'All');
  }

  @Post('get-post-opp-permissions')
  async getPostOpportunityPermissions(
    @Body() body: GetPostOpportunityPermissionsDto,
  ): Promise<ResponseFormat> {
    const permissions = await this.challengeService.getPostOpportunityPermissions(
      body.challenges,
    );
    return ResponseFormatService.responseOk(
      permissions,
      'Challenges post opportunity permissions.',
    );
  }

  @Get('get-upload-url')
  async getUploadUrl(
    @Query()
    queryParams: GetImageUploadUrl,
  ): Promise<ResponseFormat> {
    const signedUrlConfig = await this.awsS3Service.getSignedUrl2(
      queryParams.fileName,
      queryParams.contentType,
      'attachments/challenge/',
    );
    return ResponseFormatService.responseOk(signedUrlConfig, 'All');
  }

  @Get(':id')
  async getChallenge(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const challenge = await this.challengeService.searchChallenges({
      where: { id: id },
      opportunityData: true,
      userId: req['userData'].id,
    });
    return ResponseFormatService.responseOk(challenge, 'All');
  }

  @Patch('update-challenge-status/:id')
  @Permissions(
    RoleLevelEnum.challenge,
    RequestPermissionsKey.PARAMS,
    'id',
    [
      PERMISSIONS_KEYS.editChallengeTargetting,
      PERMISSIONS_KEYS.editChallengeDetails,
      PERMISSIONS_KEYS.editChallengeSettings,
      PERMISSIONS_KEYS.editChallengePhaseWorkflow,
    ],
    PermissionsCondition.OR,
  )
  async updateChallengeStatus(
    @Param('id') id: string,
    @Body() body: ChallengeStatusUpdate,
  ): Promise<ResponseFormat> {
    const updateData = await this.challengeService.updateChallengeStatus(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, 'Updated Successfully');
  }

  @Patch(':id')
  @Permissions(
    RoleLevelEnum.challenge,
    RequestPermissionsKey.PARAMS,
    'id',
    [
      PERMISSIONS_KEYS.editChallengeTargetting,
      PERMISSIONS_KEYS.editChallengeDetails,
      PERMISSIONS_KEYS.editChallengeSettings,
      PERMISSIONS_KEYS.editChallengePhaseWorkflow,
    ],
    PermissionsCondition.OR,
  )
  async updateChallenge(
    @Param('id') id: string,
    @Body() body: EditChallengeDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    if (body.sponsors && body.sponsors.length === 0) {
      return ResponseFormatService.responseBadRequest(
        [],
        'There must be atleast 1 sponsor.',
      );
    }

    if (body.attachments && body.attachments.length > 0) {
      await this.challengeAttachmentService.deleteChallengeAttachment({
        challenge: id,
      });
      const newAttachmentsData = [];
      _.map(
        body.attachments,
        (
          val: {
            url: string;
            attachmentType: string;
            isSelected: number;
            size: number;
            userAttachment: string;
          },
          _key,
        ) => {
          newAttachmentsData.push({
            url: val.url,
            attachmentType: val.attachmentType,
            isSelected: val.isSelected,
            challenge: id,
            isDeleted: false,
            size: val.size,
            userAttachment: val.userAttachment,
          });
        },
      );
      await this.challengeAttachmentService.addChallengeAttachment(
        newAttachmentsData,
      );
    } else {
      await this.challengeAttachmentService.deleteChallengeAttachment({
        challenge: id,
      });
    }
    delete body.attachments;
    const updateData = await this.challengeService.updateChallenge(
      { id: id },
      body,
      req.headers.origin as string,
    );
    return ResponseFormatService.responseOk(updateData, 'Updated Successfully');
  }

  @Patch('increase-view-count/:id')
  async increaseViewCount(
    @Param('id') id: string,
    @Body() body: IncreaseViewCountChallengeDto,
  ): Promise<ResponseFormat> {
    const updateData = await this.challengeService.increaseViewCount(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(
      updateData,
      'View Count Increased Successfully',
    );
  }

  @Delete(':id')
  async removeChallenge(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteData = await this.challengeService.archiveChallenge(
      { id: id },
      { isDeleted: true },
    );
    return ResponseFormatService.responseOk(deleteData, 'Deleted Successfully');
  }
}
