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
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { CommunityService } from './community.service';
import { CommunityDuplicateSearchDto } from './dto/CommunityDuplicateSearchDto';
import * as _ from 'lodash';
import { UserCircles } from '../user/user.circles.entity';
import { getRepository, In } from 'typeorm';
import { UtilsService } from '../../providers/utils.service';
import { GetImageUploadUrl } from '../../common/dto/GetImageUploadUrl';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { AddCommunityDto } from './dto/AddCommunityDto';
import { GetMyCommunitiesDto } from './dto/GetMyCommunitiesDto';
import { GetTenantCommunitiesDto } from './dto/GetTenantCommunitiesDto';
import { RoleActorTypes, CommunitySSOLoginEnum } from '../../enum';
import { RoleActorsService } from '../roleActors/roleActors.service';
import { GetCommunityUsersDto } from './dto/GetCommunityUsersDto';
import { UpdateCommunityDto } from './dto/UpdateCommunityDto';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorators/permissions.decorator';
import { RoleLevelEnum } from '../../enum/role-level.enum';
import { PERMISSIONS_KEYS } from '../../common/constants/constants';
import { PermissionsCondition } from '../../enum/permissions-condition.enum';
import { RequestPermissionsKey } from '../../enum/request-permissions-key.enum';
import { GetCommunityFromUrlDto } from './dto/GetCommunityFromUrlDto';

@Controller('community')
@UseGuards(PermissionsGuard)
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly awsS3Service: AwsS3Service,
    private readonly roleActorsService: RoleActorsService,
  ) {}

  @Post()
  @Permissions(
    RoleLevelEnum.community,
    RequestPermissionsKey.BODY,
    'community',
    [PERMISSIONS_KEYS.createNewCommunity],
    PermissionsCondition.OR,
  )
  async addCommunity(
    @Body() body: AddCommunityDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const communitySavedData = await this.communityService.createNewCommunity(
      body,
      req['userData'].id,
    );

    return ResponseFormatService.responseOk(
      communitySavedData,
      'Created Successfully',
    );
  }

  @Get('permissions')
  async getPermissions(
    @Query('id') id,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const permissions = await this.communityService.getPermissions(
      id,
      req['userData'].id,
    );
    return ResponseFormatService.responseOk(permissions, 'All');
  }

  @Get('details-from-url')
  async getCommunityDetailsFromUrl(
    @Query() queryParams: GetCommunityFromUrlDto,
  ): Promise<ResponseFormat> {
    const community = await this.communityService.getCommunityFromUrl(
      queryParams.url,
    );

    const communityResponse = {
      name: 'demoTestApp',
      loginWithSSO: CommunitySSOLoginEnum.DISABLED,
      valid: false,
      ...(community && {
        id: community.id,
        name: community.name,
        loginWithSSO: community.loginWithSSO,
        valid: true,
      }),
    };

    return ResponseFormatService.responseOk(communityResponse, 'All');
  }

  @Get('check-duplicate')
  async checkDuplicate(
    @Query() queryParams: CommunityDuplicateSearchDto,
  ): Promise<ResponseFormat> {
    const community = await this.communityService.getCommunityFromUrl(
      queryParams.url,
    );

    return ResponseFormatService.responseOk({ count: community ? 1 : 0 }, '');
  }
  @Get('users/:communityId')
  async getCommunityUsers(
    @Param('communityId') communityId: string,
    @Query() queryParams: GetCommunityUsersDto,
  ): Promise<ResponseFormat> {
    const options = {
      communityId: communityId,
      ...queryParams,
      name: queryParams.name || '',
    };
    const communityData = await this.communityService.getCommunityUsers(
      options,
    );
    let filteredData = _.map(
      _.head(_.map(communityData, 'communityUsers')),
      'user',
    );

    if (queryParams.excludedCircleId && filteredData.length) {
      const userCirclesRepository = getRepository(UserCircles);
      const circleUsers = await userCirclesRepository.find({
        where: {
          circleId: queryParams.excludedCircleId,
        },
      });
      const updatedKeyCircleUsers = UtilsService.updateKey(
        circleUsers,
        'userId',
        'id',
      );

      filteredData = _.differenceBy(filteredData, updatedKeyCircleUsers, 'id');
    }

    if (filteredData.length) {
      const allUserRoleActors = await this.roleActorsService.getRoleActors({
        where: {
          entityObjectId: null,
          entityType: null,
          actorId: In(filteredData.map(user => user.id)),
          actionType: RoleActorTypes.USER,
          community: communityId,
        },
        relations: ['role'],
      });
      const allUserRoleActorsGrouped = _.groupBy(allUserRoleActors, 'actorId');

      for (const user of filteredData) {
        user['role'] =
          allUserRoleActorsGrouped && allUserRoleActorsGrouped[user.id]
            ? _.head(allUserRoleActorsGrouped[user.id]).role
            : {};
      }
    }

    return ResponseFormatService.responseOk(
      filteredData,
      'All Community Users',
    );
  }

  @Get()
  async getAllCommunities(): Promise<ResponseFormat> {
    const options = {};
    const communities = await this.communityService.getCommunities(options);
    return ResponseFormatService.responseOk(communities, 'All');
  }

  @Get('my-communities')
  async getMyCommunities(
    @Req() req: Request,
    @Query() queryparams: GetMyCommunitiesDto,
  ): Promise<ResponseFormat> {
    let isDeleted = undefined;
    if (queryparams.isDeleted) {
      isDeleted = queryparams.isDeleted === 'true';
    }
    const communities = await this.communityService.getUserCommunities(
      req['userData'].id,
      queryparams.isManageable || false,
      isDeleted,
    );
    return ResponseFormatService.responseOk(communities, 'All');
  }

  @Get('tenant-communities')
  async getTenantCommunities(
    @Req() req: Request,
    @Query() queryparams: GetTenantCommunitiesDto,
  ): Promise<ResponseFormat> {
    const permissions = await this.communityService.getPermissions(
      queryparams.community,
      req['userData'].id,
    );
    if (!permissions.manageCommunities) {
      throw new ForbiddenException();
    }
    const currentCommunity = await this.communityService.getOneCommunity({
      where: { id: queryparams.community },
      relations: ['tenant'],
    });
    const communities = await this.communityService.getTenantCommunities({
      tenant: currentCommunity.tenant.id,
      isDeleted: queryparams.isDeleted,
    });
    return ResponseFormatService.responseOk(communities, 'All');
  }

  @Get('get-upload-url')
  async getUploadUrl(
    @Query()
    queryParams: GetImageUploadUrl,
  ): Promise<ResponseFormat> {
    const signedUrlConfig = await this.awsS3Service.getSignedUrl2(
      queryParams.fileName,
      queryParams.contentType,
      'attachments/community/',
    );
    return ResponseFormatService.responseOk(signedUrlConfig, 'All');
  }

  @Get('update-community-email-templates/:id')
  async updateCommunityEmailTemplates(
    @Param('id') id: string,
  ): Promise<ResponseFormat> {
    const status = await this.communityService.updateCommunityEmailTemplatesData(
      id,
    );
    return ResponseFormatService.responseOk(
      { emailTempplateUpdatedStatus: status },
      '',
    );
  }

  @Get(':id')
  async getCommunity(@Param('id') id: string): Promise<ResponseFormat> {
    const community = await this.communityService.getCommunities({ id: id });
    return ResponseFormatService.responseOk(community, '');
  }

  @Patch(':id')
  @Permissions(
    RoleLevelEnum.community,
    RequestPermissionsKey.PARAMS,
    'id',
    [PERMISSIONS_KEYS.manageCommunities, PERMISSIONS_KEYS.accessBasicSettings],
    PermissionsCondition.OR,
  )
  async updateCommunity(
    @Param('id') id: string,
    @Body() body: UpdateCommunityDto,
  ): Promise<ResponseFormat> {
    const updateResponse = await this.communityService.updateCommunity(
      { id: id },
      body,
    );

    return ResponseFormatService.responseOk(
      updateResponse,
      'Community Updated',
    );
  }

  @Delete(':id')
  async removeCommunity(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteResponse = await this.communityService.deleteCommunity({
      id: id,
    });
    return ResponseFormatService.responseOk(deleteResponse, '');
  }
}
