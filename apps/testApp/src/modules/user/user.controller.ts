import { createObjectCsvStringifier as createCsvWriter } from 'csv-writer';
import { Request } from 'express';
import * as _ from 'lodash';
import { getRepository, In } from 'typeorm';

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  PERMISSIONS_MAP,
  ROLE_ABBREVIATIONS,
} from '../../common/constants/constants';
import { RoleActorTypes } from '../../enum';
import { RoleLevelEnum } from '../../enum/role-level.enum';
// import { RolesEnum } from '../../enum/roles.enum';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { UtilsService } from '../../providers/utils.service';
import { AuthService } from '../../modules/auth/auth.service';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { MailService } from '../../shared/services/mailer.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { CircleEntity } from '../circle/circle.entity';
import { CircleService } from '../circle/circle.service';
import { CommentService } from '../comment/comment.service';
import { CommunityService } from '../community/community.service';
import { EmailTemplateService } from '../email/email-template.service';
import { FollowingContentService } from '../followingContent/followingContent.service';
import { InviteGateway } from '../invite/invite.gateway';
import { InviteService } from '../invite/invite.service';
import { OpportunityService } from '../opportunity/opportunity.service';
import { RoleService } from '../role/role.service';
import { RoleActorsService } from '../roleActors/roleActors.service';
import { TagService } from '../tag/tag.service';
import { TenantService } from '../tenant/tenant.service';
import {
  GetProfileImageUploadUrl,
  MultipleUserDto,
  SearchUserByCircleDto,
  SearchUserByCommunityDto,
  UserDuplicateSearchDto,
  UserGroupDto,
  UserRegisterDto,
} from './dto';
import { EditUserRole } from './dto/EditUserRole';
import { UserCircles } from './user.circles.entity';
import { UserService } from './user.service';
import { UserCommCommunities } from './userCommunityCommunities.entity';
import { GetUniqueUsersCountDto } from './dto/GetUniqueUsersCountDto';
import { uniqBy } from 'lodash';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorators/permissions.decorator';
import { PERMISSIONS_KEYS } from '../../common/constants/constants';
import { PermissionsCondition } from '../../enum/permissions-condition.enum';
import { RequestPermissionsKey } from '../../enum/request-permissions-key.enum';
import { VoteService } from '../vote/vote.service';
import { UserActionPointService } from '../userActionPoint/userActionPoint.service';
import { parse } from 'tldts';

// import FileType from 'file-type';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    public readonly authService: AuthService,
    public readonly communityService: CommunityService,
    public readonly tenantService: TenantService,
    public readonly mailService: MailService,
    public readonly inviteService: InviteService,
    public readonly inviteGateway: InviteGateway,
    public readonly emailTemplateService: EmailTemplateService,
    public readonly tagService: TagService,
    private readonly awsS3Service: AwsS3Service,
    private readonly opportunityService: OpportunityService,
    private readonly commentService: CommentService,
    private readonly followingContentService: FollowingContentService,
    private readonly circleService: CircleService,
    public readonly roleActorService: RoleActorsService,
    public readonly roleService: RoleService,
    public readonly voteService: VoteService,
    public readonly userActionPointService: UserActionPointService,
  ) {}

  @Post()
  async addUser(@Body() body: UserRegisterDto): Promise<ResponseFormat> {
    body.email = body.email.toLowerCase();
    const response = await this.userService.addUser(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get('get-current-user-data')
  async refreshUserToken(@Req() req: Request): Promise<ResponseFormat> {
    const userFullData = await this.userService.getUsers({
      relations: [
        'userCommunities',
        'userCommunities.community',
        'opportunities',
        'opportunities.opportunityType',
        'profileImage',
      ],
      where: {
        email: req['userData'].email,
      },
    });
    /**
     * Updating Object Structure for front end
     */
    const userCommunitiesTemp = userFullData[0].userCommunities.map(
      userCom => userCom.community,
    );
    if (userFullData[0].skills && userFullData[0].skills.length) {
      userFullData[0]['skillsData'] = await this.tagService.getTags({
        where: { id: In(userFullData[0].skills) },
      });
    }
    userFullData[0]['communities'] = userCommunitiesTemp;

    // Fetching User communities roles
    userFullData[0]['roles'] = await this.roleActorService.getRoleActors({
      where: {
        entityObjectId: null,
        entityType: null,
        actorId: userFullData[0].id,
        actionType: RoleActorTypes.USER,
        community: In(
          userFullData[0].userCommunities.map(
            userCommunity => userCommunity.communityId,
          ),
        ),
      },
      relations: ['role'],
    });

    delete userFullData[0].userCommunities;
    /**
     * Updating Object Structure for front end
     */
    return ResponseFormatService.responseOk(
      userFullData,
      'Logged In User Data',
    );
  }

  @Get('check-duplicate')
  async checkDuplicate(
    @Query() queryParams: UserDuplicateSearchDto,
  ): Promise<ResponseFormat> {
    const newqueryParams = { where: {}, relations: {} };
    newqueryParams.where = JSON.parse(JSON.stringify(queryParams));
    newqueryParams.relations = ['userCommunities', 'userCommunities.community'];
    const data = await this.userService.getUsers(newqueryParams);
    return ResponseFormatService.responseOk(
      { data: data[0], count: data[1] },
      'All',
    );
  }
  /**
   *
   * Get user data list with meta data
   * @param {object} queryParams
   * @return List of users
   */
  @Get()
  async getAllUsers(
    @Query() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const userData = {};
    const options = {
      where: {},
      relations: ['profileImage', 'userCommunities'],
    };
    let follows = [] || {};
    if (_.get(queryParams, 'id') && typeof queryParams.id === 'object') {
      //Get multiple users list
      options.where['id'] = In(queryParams.id);

      //Get user followers
      follows = await this.followingContentService.getUserFollowByEntityObjectIds(
        queryParams.id,
        req['userData'].id,
      );
    }
    userData['users'] = await this.userService.getUsers(options);

    //Extract Skills Id's
    let skills = [];
    _.map(userData['users'], user => {
      const followContent = _.find(follows, ['entityObjectId', user.id]);
      if (followContent) {
        user.following = true;
        user.followId = _.get(followContent, 'id');
      }
      if (!_.isEmpty(user.skills)) {
        skills = [...user.skills];
      }
    });

    //Get Skills Defination
    if (!_.isEmpty(skills)) {
      const tags = {};
      const tagsData = await this.tagService.getTags({
        select: ['id', 'name'],
        where: {
          id: In(skills),
        },
      });
      _.map(tagsData, val => {
        tags[val.id] = val.name;
      });
      userData['tags'] = tags;
    }

    return ResponseFormatService.responseOk(userData, 'List Of Users');
  }

  @Post('get-users-profile-image')
  async getMultipleUsers(@Body() body: MultipleUserDto) {
    const userData = await this.userService.getUsers({
      where: { id: In(body.userIds) },
      relations: ['profileImage'],
    });
    const finalData = {};
    _.map(userData, val => {
      finalData[val.id] = val.profileImage.url;
    });
    return ResponseFormatService.responseOk(finalData, '');
  }

  @Post('get-users-data')
  async getMultipleUsersData(@Body() body: MultipleUserDto) {
    const userData = await this.userService.getUsers({
      where: { id: In(body.userIds) },
    });
    const finalData = {};
    _.map(userData, val => {
      finalData[val.id] = val;
    });
    return ResponseFormatService.responseOk(finalData, '');
  }

  @Get('groups')
  async getAllUsersWithGroups(
    @Query() queryParams: UserGroupDto,
  ): Promise<ResponseFormat> {
    const groupData = await this.circleService.getCircles({
      where: { community: queryParams.community },
    });
    const userCirclesRepository = getRepository(UserCircles);
    const circleUsersCount = [];
    _.map(groupData, (val: CircleEntity) => {
      circleUsersCount.push(
        userCirclesRepository.find({
          where: { circleId: val.id },
        }),
      );
    });

    let userGroupData = await Promise.all(circleUsersCount);
    userGroupData = _.flatMap(userGroupData);
    _.map(groupData, (val: CircleEntity) => {
      val['type'] = 'group';
      val['userCount'] = _.filter(userGroupData, function(o: UserCircles) {
        return o.circleId == val.id;
      }).length;
    });

    const userData = await this.userService.getUsersWithCommunity(
      queryParams.community,
    );

    _.map(userData, user => {
      user['name'] = user.firstName + ' ' + user.lastName;
      user['type'] = 'user';
    });

    const finalData = _.orderBy(
      _.flatMap([userData, groupData]),
      ['name'],
      ['asc'],
    );

    return ResponseFormatService.responseOk(
      finalData,
      'List Of Users With Groups',
    );
  }
  @Get('get-user-counts')
  async getUserCounts(@Query()
  queryParams: {
    userIds: [];
    entityType: any;
  }): Promise<ResponseFormat> {
    const groupedUserDataFinal = {};
    const groupedUserDataFinalComment = {};
    const groupedUserDataFinalVote = {};
    /*  */
    const options = {
      relations: ['user'],
      where: {
        user: In(queryParams.userIds),
        // opportunityType: 'idea',
        isDeleted: false,
      },
    };

    const ideaDadata = await this.opportunityService.getOpportunities(options);
    const groupedIdeaDadata = _.groupBy(ideaDadata, 'user.id');

    for (const iterator in groupedIdeaDadata) {
      groupedUserDataFinal[iterator] = groupedIdeaDadata[iterator].length;
    }
    /*  */
    const optionComments = {
      relations: ['user'],
      where: {
        user: In(queryParams.userIds),
        entityType: queryParams.entityType,
      },
    };

    const commentData = await this.commentService.getComments(optionComments);
    const groupedCommentData = _.groupBy(commentData, 'user.id');

    for (const iterator in groupedCommentData) {
      groupedUserDataFinalComment[iterator] =
        groupedCommentData[iterator].length;
    }
    /*  */
    /*  */
    const optionVotes = {
      relations: ['user'],
      where: {
        user: In(queryParams.userIds),
        entityType: queryParams.entityType,
      },
    };

    const voteData = await this.voteService.getAllVote(optionVotes);
    const groupedvoteDataData = _.groupBy(voteData, 'user.id');

    for (const iterator in groupedvoteDataData) {
      groupedUserDataFinalVote[iterator] = groupedvoteDataData[iterator].length;
    }
    /*  */
    const followDataFinal = {};
    const followData = await this.followingContentService.getFollowingContents({
      relations: ['userFollowingContents'],
      where: {
        entityObjectId: In(queryParams.userIds),
      },
    });
    for (const iterator of followData) {
      followDataFinal[iterator.entityObjectId] =
        iterator.userFollowingContents.length;
    }

    return ResponseFormatService.responseOk(
      {
        ideas: groupedUserDataFinal,
        comment: groupedUserDataFinalComment,
        vote: groupedUserDataFinalVote,
        follow: followDataFinal,
      },
      'All Users Counts',
    );
  }
  @Get('get-user-detail-counts')
  async getUserDetailCounts(@Query()
  queryParams: {
    userIds: [];
    community: any;
  }): Promise<ResponseFormat> {
    const groupedUserDataFinal = {};
    const groupedUserDataFinalComment = {};
    const groupedUserDataFinalVote = {};
    const groupedUserDataFinalPoints = {};
    const groupedUserDataFinalRank = {};
    /*  */
    const options = {
      relations: ['user'],
      where: {
        user: In(queryParams.userIds),
        // opportunityType: 'idea',
        isDeleted: false,
      },
    };

    const ideaDadata = await this.opportunityService.getOpportunities(options);
    const groupedIdeaDadata = _.groupBy(ideaDadata, 'user.id');

    for (const iterator in groupedIdeaDadata) {
      groupedUserDataFinal[iterator] = groupedIdeaDadata[iterator].length;
    }
    /*  */
    const optionComments = {
      relations: ['user'],
      where: {
        user: In(queryParams.userIds),
        community: queryParams.community,
      },
    };

    const commentData = await this.commentService.getComments(optionComments);
    const groupedCommentData = _.groupBy(commentData, 'user.id');

    for (const iterator in groupedCommentData) {
      groupedUserDataFinalComment[iterator] =
        groupedCommentData[iterator].length;
    }
    /*  */
    /*  */
    const optionPoints = {
      relations: ['user'],
      where: {
        user: In(queryParams.userIds),
        community: queryParams.community,
      },
    };

    const pointsData = await this.userActionPointService.getUserActionPoints(
      optionPoints,
    );
    const groupedPointsData = _.groupBy(pointsData, 'user.id');

    for (const iterator in groupedPointsData) {
      groupedUserDataFinalPoints[iterator] = _.sumBy(
        groupedPointsData[iterator],
        'experiencePoint',
      );
    }
    /*  */
    /*  */
    const optionVotes = {
      relations: ['user'],
      where: {
        user: In(queryParams.userIds),
        community: queryParams.community,
      },
    };

    const voteData = await this.voteService.getAllVote(optionVotes);

    const groupedVoteData = _.groupBy(voteData, 'user.id');

    for (const iterator in groupedVoteData) {
      groupedUserDataFinalVote[iterator] = groupedVoteData[iterator].length;
    }
    /*  */

    const communityActionPoints = await this.userActionPointService.getUserActionPointsProcess(
      {
        community: queryParams.community,
        frequency: 'month',
      },
    );
    const communityActionPointsGrouped = _.groupBy(communityActionPoints, 'id');
    for (const iterator in communityActionPointsGrouped) {
      groupedUserDataFinalRank[iterator] = _.head(
        communityActionPointsGrouped[iterator],
      )['rank'];
    }

    return ResponseFormatService.responseOk(
      {
        rank: groupedUserDataFinalRank,
        points: groupedUserDataFinalPoints,
        ideas: groupedUserDataFinal,
        comment: groupedUserDataFinalComment,
        vote: groupedUserDataFinalVote,
      },
      'All Users Counts',
    );
  }
  @Get('upload-avatar')
  async getAllUsersAVA(): Promise<ResponseFormat> {
    const content = await UtilsService.getUserAvatar(
      'zeeshan',
      'altaf',
      100,
      'D3F9F1',
      '898989',
    );
    const avatarUrl = await this.awsS3Service.uploadImage(
      {
        buffer: content,
        mimetype: 'image/png',
      },
      'attachments/users/',
    );

    return ResponseFormatService.responseOk(avatarUrl, 'All Users');
  }

  @Get('search')
  async searchCircles(
    @Query() queryParams: SearchUserByCircleDto,
  ): Promise<ResponseFormat> {
    try {
      const userCirclesRepository = getRepository(UserCircles);
      const data = await this.userService.searchUserCircles(
        queryParams.limit,
        queryParams.offset,
        queryParams.communityId,
        queryParams.circleId,
        queryParams.showArchived ? queryParams.showArchived : 'false',
        {
          name: queryParams.searchByName ? queryParams.searchByName : '',
          userName: queryParams.searchByUsername
            ? queryParams.searchByUsername
            : '',
          email: queryParams.searchByEmail ? queryParams.searchByEmail : '',
        },
      );
      /**
       * Counting the total records
       */
      const dataCount = await this.userService.getCircleUserCount(
        queryParams.communityId,
        queryParams.circleId,
        queryParams.showArchived ? queryParams.showArchived : 'false',
      );

      if (!data[0].length) {
        return ResponseFormatService.responseOk([], 'No Users Available');
      }

      // Fetching all users' roles.
      const allUserRoleActors = await this.roleActorService.getRoleActors({
        where: {
          entityObjectId: null,
          entityType: null,
          actorId: In(data[0].map(user => user.id)),
          actionType: RoleActorTypes.USER,
          community: queryParams.communityId,
        },
        relations: ['role'],
      });
      const allUserRoleActorsGrouped = _.groupBy(allUserRoleActors, 'actorId');

      let finalData = [];
      for (const iterator of data[0]) {
        const userRelatedCircles = await userCirclesRepository.find({
          relations: ['circle'],
          where: { user: iterator.id },
        });
        finalData.push({
          ...iterator,
          role:
            allUserRoleActorsGrouped && allUserRoleActorsGrouped[iterator.id]
              ? _.head(allUserRoleActorsGrouped[iterator.id]).role
              : {},
          fullName: iterator.firstName + ' ' + iterator.lastName,
          groupRole: iterator.userCircles[0].role,
          userCircles: userRelatedCircles,
        });
      }

      if (queryParams.sortBy && queryParams.sortType) {
        const dataSorted = _.orderBy(
          finalData,
          [queryParams.sortBy],
          [queryParams.sortType],
        );
        finalData = dataSorted;
      }

      if (queryParams.exportData === 'true') {
        const csvWriter = createCsvWriter({
          header: [
            { id: 'fullName', title: 'NAME' },
            { id: 'userName', title: 'Username' },
            { id: 'createdBy', title: 'Creator' },
            { id: 'role', title: 'Role' },
            { id: 'email', title: 'Email:' },
            { id: 'groupRole', title: 'Group Role' },
            { id: 'userCircles', title: 'Groups' },
            { id: 'isDeleted', title: 'Archived' },
          ],
        });
        const dataExport = [];
        (finalData || []).forEach(user => {
          dataExport.push({
            fullName: user.fullName,
            userName: user.userName,
            createdBy: user.createdBy,
            role: user.role.title || 'User',
            email: user.email,
            userCircles: user.userCircles.map(e => e.circle.name),
            groupRole: user.groupRole,
            isDeleted: user.isDeleted,
          });
        });

        const data = {
          data: csvWriter.stringifyRecords(dataExport),
          headers: csvWriter.getHeaderString(),
        };

        return ResponseFormatService.responseOk(data, 'Exported Successfully');
      }
      return ResponseFormatService.responseOk(
        { data: finalData, count: dataCount },
        'Group Users',
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('community/search')
  async searchByCommunities(
    @Query() queryParams: SearchUserByCommunityDto,
  ): Promise<ResponseFormat> {
    try {
      // const userCirclesRepository = getRepository(UserCircles);
      const data = await this.userService.searchUserCommunities(
        queryParams.take,
        queryParams.skip,
        queryParams.communityId,
        queryParams.showArchived ? queryParams.showArchived : 'false',
        {
          name: queryParams.searchText ? queryParams.searchText : '',
          userName: queryParams.searchText ? queryParams.searchText : '',
          email: queryParams.searchText ? queryParams.searchText : '',
        },
      );

      /**
       * Counting the total records
       */
      // const dataCount = await this.userService.getCommunityUserCount(
      //   queryParams.communityId,
      //   queryParams.showArchived ? queryParams.showArchived : 'false',
      // );

      if (!data[0].length) {
        return ResponseFormatService.responseOk([], 'No Users Available');
      }
      const allUserRoles = await this.roleActorService.getRoleActors({
        where: {
          entityObjectId: null,
          entityType: null,
          actorId: In(data[0].map(user => user.id)),
          actionType: RoleActorTypes.USER,
          community: queryParams.communityId,
        },
        relations: ['role'],
      });
      const allUserRolesGrouped = _.groupBy(allUserRoles, 'actorId');

      let finalData = [];
      for (const iterator of data[0]) {
        // const userRelatedCircles = await userCirclesRepository.find({
        //   relations: ['circle'],
        //   where: { userId: iterator.id },
        // });
        finalData.push({
          ...iterator,
          role:
            allUserRolesGrouped && allUserRolesGrouped[iterator.id]
              ? _.head(allUserRolesGrouped[iterator.id])
              : {},
          fullName: iterator.firstName + ' ' + iterator.lastName,
          groupRole:
            iterator.userCircles[0] && iterator.userCircles[0].role
              ? iterator.userCircles[0].role
              : '',
          // userCircles: userRelatedCircles,
          userCircles: iterator.userCircles.filter(
            userCircle => userCircle.user,
          ),
        });
      }

      if (queryParams.sortBy && queryParams.sortType) {
        const dataSorted = _.orderBy(
          finalData,
          [queryParams.sortBy],
          [queryParams.sortType],
        );
        finalData = dataSorted;
      }

      if (queryParams.exportData === 'true') {
        const csvWriter = createCsvWriter({
          header: [
            { id: 'fullName', title: 'NAME' },
            { id: 'userName', title: 'Username' },
            { id: 'createdBy', title: 'Creator' },
            { id: 'role', title: 'Role' },
            { id: 'email', title: 'Email:' },
            { id: 'groupRole', title: 'Group Role' },
            { id: 'userCircles', title: 'Groups' },
            { id: 'isDeleted', title: 'Archived' },
          ],
        });
        const dataExport = [];
        (finalData || []).forEach(user => {
          dataExport.push({
            fullName: user.fullName,
            userName: user.userName,
            createdBy: user.createdBy,
            role: user.role,
            email: user.email,
            userCircles: user.userCircles.map(e => e.circle.name),
            groupRole: user.groupRole,
            isDeleted: user.isDeleted,
          });
        });

        const data = {
          data: csvWriter.stringifyRecords(dataExport),
          headers: csvWriter.getHeaderString(),
        };

        return ResponseFormatService.responseOk(data, 'Exported Successfully');
      }
      return ResponseFormatService.responseOk(
        { data: finalData, count: data[1] },
        'Group Users',
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('count-by-circle')
  async getUsersCountByCircle(
    @Query() queryParams: SearchUserByCircleDto,
  ): Promise<ResponseFormat> {
    const archived = await this.userService.getCircleUserCount(
      queryParams.communityId,
      queryParams.circleId,
      'true',
    );

    const unArchived = await this.userService.getCircleUserCount(
      queryParams.communityId,
      queryParams.circleId,
      'false',
    );

    return ResponseFormatService.responseOk(
      {
        archive: archived,
        active: unArchived,
      },
      'User Count By Circle',
    );
  }

  @Get('count-by-community')
  async getUsersCountBycommunity(@Query()
  queryParams: {
    communityId;
  }): Promise<ResponseFormat> {
    const archived = await this.userService.getCommunityUserCount(
      queryParams.communityId,
      'true',
    );

    const unArchived = await this.userService.getCommunityUserCount(
      queryParams.communityId,
      'false',
    );

    return ResponseFormatService.responseOk(
      {
        archive: archived,
        active: unArchived,
      },
      'User Count By Circle',
    );
  }

  @Get('get-upload-url')
  async getUploadUrl(
    @Query()
    queryParams: GetProfileImageUploadUrl,
  ): Promise<ResponseFormat> {
    const signedUrlConfig = await this.awsS3Service.getSignedUrl2(
      queryParams.fileName,
      queryParams.contentType,
      'attachments/users/',
    );
    return ResponseFormatService.responseOk(signedUrlConfig, 'All');
  }

  @Post('unique-count')
  async getUniqueUsersCount(
    @Body() body: GetUniqueUsersCountDto,
  ): Promise<ResponseFormat> {
    let users = [];

    // Find individual users
    if (body.users && body.users.length) {
      users = users.concat(
        await this.userService.getUsers({
          where: {
            id: In(body.users),
            community: body.community,
          },
        }),
      );
    }

    // Find group users
    if (body.groups && body.groups.length) {
      users = users.concat(
        await this.circleService.getCircleUsers({
          where: {
            id: In(body.groups),
            community: body.community,
          },
        }),
      );
    }

    const uniqueUsers = uniqBy(users, 'id');

    const count = uniqueUsers.length;

    return ResponseFormatService.responseOk({ count }, 'Unique users count');
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<ResponseFormatService> {
    const users = await this.userService.getUsers({
      relations: [
        'userCommunities',
        'userCommunities.community',
        'opportunities',
        'opportunities.opportunityType',
        'profileImage',
      ],
      where: { id: id },
    });
    if (!users.length) {
      return ResponseFormatService.responseNotFound([], 'User Not Found');
    }

    if (users[0].skills && users[0].skills.length) {
      users[0]['skillsData'] = await this.tagService.getTags({
        where: { id: In(users[0].skills) },
      });
    }
    if (users[0].opportunities && users[0].opportunities.length) {
      users[0][
        'draftOpportunities'
      ] = UtilsService.getUserDraftOpportunityCount(users[0].opportunities);
      delete users[0].opportunities;
    }
    users[0]['communities'] = UtilsService.updateUserCommunityData(
      users[0].userCommunities,
    );

    users[0]['roles'] = await this.roleActorService.getRoleActors({
      where: {
        entityObjectId: null,
        entityType: null,
        actorId: id,
        actionType: RoleActorTypes.USER,
        community: In(
          users[0].userCommunities.map(
            userCommunity => userCommunity.communityId,
          ),
        ),
      },
      relations: ['role'],
    });

    return ResponseFormatService.responseOk(users, '');
  }

  @Permissions(
    RoleLevelEnum.community,
    RequestPermissionsKey.BODY,
    'community',
    [PERMISSIONS_KEYS.manageUserRoles],
    PermissionsCondition.AND,
  )
  @Patch('update-user-role')
  async updateUserRole(
    @Body() body: EditUserRole,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    if (req['userData'].id === body.userId) {
      throw new ForbiddenException('Forbidden resource');
    }

    const [communityPermissions, role, currentRoleActor] = await Promise.all([
      this.communityService.getPermissions(body.community, req['userData'].id),
      this.roleService.getOneRole({
        where: { id: body.role },
      }),
      this.roleActorService.getRoleActors({
        where: {
          entityObjectId: null,
          entityType: null,
          actorId: body.userId,
          actionType: RoleActorTypes.USER,
          community: body.community,
        },
        relations: ['role'],
      }),
    ]);

    if (
      communityPermissions.manageUserRoles === PERMISSIONS_MAP.SCENARIO &&
      (role.abbreviation === ROLE_ABBREVIATIONS.ADMIN ||
        _.head(currentRoleActor).role.abbreviation === ROLE_ABBREVIATIONS.ADMIN)
    ) {
      throw new ForbiddenException('Forbidden resource');
    }

    const updateData = await this.roleActorService.updateRoleActors(
      {
        actorType: RoleActorTypes.USER,
        actorId: body.userId,
        entityObjectId: null,
        entityType: null,
        community: body.community,
      },
      { role: body.role },
    );

    return ResponseFormatService.responseOk(updateData, '');
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: {},
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const updateData = await this.userService.updateUser(
      { id: id },
      body,
      req['userData']['currentCommunity'],
      true,
    );

    const userEntity = await this.userService.getUsers({
      relations: [
        'userCommunities',
        'userCommunities.community',
        'opportunities',
        'opportunities.opportunityType',
        'profileImage',
      ],
      where: {
        id: id,
      },
    });
    userEntity[0]['communities'] = UtilsService.updateUserCommunityData(
      userEntity[0].userCommunities,
    );
    if (userEntity[0].opportunities && userEntity[0].opportunities.length) {
      userEntity[0][
        'draftOpportunities'
      ] = UtilsService.getUserDraftOpportunityCount(
        userEntity[0].opportunities,
      );
      delete userEntity[0].opportunities;
    }
    if (userEntity.length) {
      const nonAcceptedInvites = await this.inviteService.getInvites({
        relations: ['community'],
        where: { email: userEntity[0].email, inviteAccepted: false },
      });
      userEntity[0]['invites'] = nonAcceptedInvites;
    }
    updateData['user'] = userEntity[0];
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete('community/:communityId')
  async removeUser(
    @Param('communityId') communityId,
    @Body('users') users: [],
  ): Promise<ResponseFormat> {
    const userCommunities = getRepository(UserCommCommunities);
    const updateData = await userCommunities.update(
      { userId: In(users), communityId: communityId },
      { isDeleted: true },
    );
    return ResponseFormatService.responseOk(
      updateData,
      'User Deleted Successfully',
    );
  }

  @Delete('bulk')
  async removeBulkUser(
    @Body('users') users: [],
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const deleteData = await this.userService.updateUser(
      { id: In(users) },
      { isDeleted: true },
      req['userData']['currentCommunity'],
      true,
    );
    return ResponseFormatService.responseOk(
      deleteData,
      'Users Deleted Successfully',
    );
  }
  findUserCommunity(userCommunitiesObject, communityUrl): {} {
    const matchedCommunity = _.find(userCommunitiesObject, function(o) {
      return parse(o.community.url).hostname === parse(communityUrl).hostname;
    });
    return matchedCommunity;
  }
}
