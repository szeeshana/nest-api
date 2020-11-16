import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { In, Between } from 'typeorm';
import { OpportunityService } from './opportunity.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import {
  AddOpportunityDto,
  SimilarOpportunitiesDto,
  EditOpportunityDto,
  FilterCountsDto,
  AddOpportunityFieldDataDto,
  IncreaseViewCountOpportunityDto,
  // GetOpportunityDataBodyDto,
  GetOpportunityDataDetailBodyDto,
} from './dto';
import { Request } from 'express';
import * as _ from 'lodash';
import { OpportunityAttachmentService } from '../opportunityAttachment/opportunityAttachment.service';
import { BookmarkService } from '../bookmark/bookmark.service';
import { VoteService } from '../vote/vote.service';
import { TagService } from '../tag/tag.service';
import { FollowingContentService } from '../followingContent/followingContent.service';
import {
  TIME_LIMITS,
  ENTITY_TYPES,
  ACTION_ITEM_ABBREVIATIONS,
  CHALLENGE_SORTING,
  ACTION_TYPES,
  INNO_BOT,
  PERMISSIONS_MAP,
} from '../../common/constants/constants';
import { CommentService } from '../comment/comment.service';
import { OpportunityEntity } from './opportunity.entity';
import { TagEntity } from '../tag/tag.entity';
import { EntityMetaService } from '../../shared/services/EntityMeta.service';
import { MentionService } from '../mention/mention.service';
import { StageAssignmentSettingService } from '../stage/stageAssignmentSettings.service';
import { StageNotificationSettingService } from '../stage/stageNotificationSetting.service';
import { StageAssigneeService } from '../stage/stageAssigneeSettings.service';
import * as moment from 'moment';
import { CustomFieldDataService } from '../customField/customFieldData.service';
import { CustomFieldIntegrationService } from '../customField/customFieldIntegration.service';
import { StageHistoryService } from '../stage/stageHistory.service';
import { StageService } from '../stage/stage.service';
import { EvaluationCriteriaService } from '../evaluationCriteria/evaluationCriteria.service';
import { NotificationHookService } from '../../shared/services/notificationHook';
import { OpportunityEvaluationResponseService } from '../evaluationCriteria/opportunityEvaluationResponse.service';
import { GetAssigneesCountDto } from './dto/GetAssigneesCountDto';
import { EntityExperienceSettingService } from '../entityExperienceSetting/entityExperienceSetting.service';
import { GetStageNotifiableUsersCountDto } from './dto/GetStageNotifiableUsersCountDto';
import { GetBulkOpportunityPermissionsDto } from './dto/GetBulkOpportunityPermissionsDto';
import { EntityVisibilitySettingService } from '../entityVisibilitySetting/entityVisibilitySetting.service';
import { WorkflowService } from '../workflow/workflow.service';
import { DefaultSort } from '../../enum/default-sort.enum';
import { ElasticSearchService } from '../../shared/services/elasticSearchHook';
import { UserService } from '../user/user.service';
import { OpportunityUserService } from '../opportunityUser/opportunityUser.service';
import { OpportunityUserType } from '../../enum/opportunity-user-type.enum';
import { OpportunityTypeService } from '../opportunityType/opportunityType.service';
import { SharedService } from '../../shared/services/shared.services';
import { VoteType } from '../../enum';

@Controller('opportunity')
export class OpportunityController {
  constructor(
    private readonly opportunityService: OpportunityService,
    private readonly opportunityAttachmentService: OpportunityAttachmentService,
    private readonly bookmarkService: BookmarkService,
    private readonly voteService: VoteService,
    public readonly tagService: TagService,
    public readonly followingContentService: FollowingContentService,
    public readonly commentService: CommentService,
    public readonly mentionService: MentionService,
    public readonly stageAssigneeService: StageAssigneeService,
    public readonly stageNotificationSettingService: StageNotificationSettingService,
    public readonly stageAssignmentSettingService: StageAssignmentSettingService,
    public readonly customFieldDataService: CustomFieldDataService,
    public readonly customFieldIntegrationService: CustomFieldIntegrationService,
    public readonly stageHistoryService: StageHistoryService,
    public readonly stageService: StageService,
    public readonly evaluationCriteriaService: EvaluationCriteriaService,
    private readonly opportunityEvaluationResponseService: OpportunityEvaluationResponseService,
    public readonly entityExperienceSettingService: EntityExperienceSettingService,
    public readonly entityVisibilitySettingService: EntityVisibilitySettingService,
    public readonly workflowService: WorkflowService,
    public readonly elasticSearchService: ElasticSearchService,
    public readonly userService: UserService,
    public readonly opportunityUserService: OpportunityUserService,
    public readonly opportunityTypeService: OpportunityTypeService,
    public readonly sharedService: SharedService,
  ) {}

  @Post()
  async addOpportunity(
    @Body() body: AddOpportunityDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    body.user = req['userData'].id;
    req['userData']['community'] = body.community;
    body.isDeleted = false;
    const response = await this.opportunityService.addOpportunity(
      body,
      req['userData'],
    );

    if (body.attachments.length) {
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
            isSelected: val.isSelected ? 1 : 0,
            opportunity: response.id,
            opportunityType: response.opportunityType,
            isDeleted: false,
            size: val.size,
            userAttachment: val.userAttachment,
          });
        },
      );
      await this.opportunityAttachmentService.addOpportunityAttachment(
        newAttachmentsData,
      );
    }

    const savedOpportunity = await this.opportunityService.getOneOpportunity({
      where: { id: response.id },
      relations: [
        'challenge',
        'opportunityType',
        'community',
        'stage',
        'stage.actionItem',
      ],
    });

    const oppoEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    // Selecting default workflow for the opportunity.
    const workflowId =
      (savedOpportunity.challenge && savedOpportunity.challenge.workflowId) ||
      savedOpportunity.opportunityType.workflowId;
    if (workflowId) {
      const workflow = await this.workflowService.getOneWorkflow({
        where: { id: workflowId },
      });
      const firstStage = await this.stageService.getOneStage({
        where: { workflow: workflowId, isDeleted: false },
        order: { orderNumber: 'ASC' },
        relations: ['workflow', 'status', 'actionItem'],
      });

      await this.opportunityService.attachStageToOpportunity(
        firstStage,
        savedOpportunity,
        req.headers.origin as string,
      );

      // Sending automatic workflow addition notification.
      // Selecting InnoBot as user for automated workflow selection.
      const actorData = {
        ...req['userData'],
        id: 0,
        firstName: INNO_BOT.name,
        email: INNO_BOT.email,
        community: savedOpportunity.communityId,
      };
      const actionData = {
        ...savedOpportunity,
        entityObjectId: savedOpportunity.id,
        entityType: oppoEntityType.id,
      };

      this.opportunityService.generateUpdateStageNotification({
        opportunity: savedOpportunity,
        autogenerated: true,
        stageNotificationSettings: firstStage['stageNotificationSettings'],
        actionData,
        actorData,
        actionType: ACTION_TYPES.ADD_WORKFLOW,
        newStage: firstStage,
        newWorkflow: workflow,
      });
    }

    return ResponseFormatService.responseOk(
      response,
      'Opportunity Added Successfully',
    );
  }

  @Post('import-bulk')
  async importBulkOpportunities(
    @Req() req: Request,
    @Body() body,
  ): Promise<ResponseFormat> {
    const ownersInfo = {};
    const addOpportunityPromiseArr = [];
    let allRelatedUsers = [];
    let allRelatedOppoTypes = _.map(body, val => {
      val['opportunityType'] = val['opportunityType']
        .toLowerCase()
        .replace(/\s/g, '_');
      return val['opportunityType'];
    });
    allRelatedOppoTypes = _.uniq(allRelatedOppoTypes);
    const foundOppoTypes = await this.opportunityTypeService.getOpportunityTypes(
      {
        where: { abbreviation: In(allRelatedOppoTypes) },
      },
    );
    const oppoTypesGrouped = _.groupBy(foundOppoTypes, 'abbreviation');
    const toAddOpportunityTypes = [];
    _.forEach(allRelatedOppoTypes, val => {
      if (!oppoTypesGrouped[val]) {
        const tempName = _.startCase(_.toLower(val.replace(/_/g, ' ')));
        toAddOpportunityTypes.push(
          this.opportunityTypeService.addOpportunityType({
            name: tempName,
            icon: 'lightbulb',
            abbreviation: val,
            description: tempName,
            color: '#1AB394',
            community: _.head(body)['community'],
          }),
        );
      }
    });
    const addedOpportunityTypes = await Promise.all(toAddOpportunityTypes);
    const groupedAddedOpportunityTypes = _.groupBy(
      addedOpportunityTypes,
      'abbreviation',
    );
    const allAvailableOppoTypes = {
      ...groupedAddedOpportunityTypes,
      ...oppoTypesGrouped,
    };
    _.forEach(body, (val, key) => {
      const tempObj = {
        title: val['title'],
        description: val['description'],
        opportunityType: _.head(allAvailableOppoTypes[val['opportunityType']])[
          'id'
        ],
        community: val['community'],
        draft: val['draft'],
        anonymous: val['anonymous'],
        tags: [],
        mentions: [],
        user: req['userData'].id,
        isDeleted: false,
      };
      ownersInfo[key] = {
        owners: val['owners'],
        submitters: val['submitters'],
        coSubmitters: val['coSubmitters'],
      };
      allRelatedUsers = [
        ...allRelatedUsers,
        ...val['owners'],
        ...val['submitters'],
        ...val['coSubmitters'],
      ];
      addOpportunityPromiseArr.push(
        this.opportunityService.addOpportunity(tempObj, req['userData']),
      );
    });
    const addedOpportunities = await Promise.all(addOpportunityPromiseArr);

    allRelatedUsers = _.uniq(allRelatedUsers);
    const allUsers = await this.userService.getUsers({
      where: { email: In(allRelatedUsers) },
    });
    const groupedUsers = _.groupBy(allUsers, 'email');

    const opportunityUserAddPromise = [];
    _.forEach(addedOpportunities, (oppoVal, oppoKey) => {
      _.forEach(ownersInfo[oppoKey]['owners'], val => {
        if (groupedUsers[val]) {
          opportunityUserAddPromise.push(
            this.opportunityUserService.addOpportunityUserWithSetting(
              [
                {
                  user: req['userData'].id,
                  opportunity: oppoVal.id,
                  community: oppoVal.community,
                  message: '',
                  opportunityUserType: OpportunityUserType.OWNER,
                },
              ],
              req['userData'],
              false,
            ),
          );
        }
      });
      _.forEach(ownersInfo[oppoKey]['submitters'], val => {
        if (groupedUsers[val]) {
          opportunityUserAddPromise.push(
            this.opportunityUserService.addOpportunityUserWithSetting(
              [
                {
                  user: req['userData'].id,
                  opportunity: oppoVal.id,
                  community: oppoVal.community,
                  message: '',
                  opportunityUserType: OpportunityUserType.SUBMITTER,
                },
              ],
              req['userData'],
              false,
            ),
          );
        }
      });
      _.forEach(ownersInfo[oppoKey]['coSubmitters'], val => {
        if (groupedUsers[val]) {
          opportunityUserAddPromise.push(
            this.opportunityUserService.addOpportunityUserWithSetting(
              [
                {
                  user: req['userData'].id,
                  opportunity: oppoVal.id,
                  community: oppoVal.community,
                  message: '',
                  opportunityUserType: OpportunityUserType.CONTRIBUTOR,
                },
              ],
              req['userData'],
              false,
            ),
          );
        }
      });
    });
    await Promise.all(opportunityUserAddPromise);

    return ResponseFormatService.responseOk(
      addedOpportunities,
      'Opportunity Added Successfully',
    );
  }

  @Get()
  async getAllOpportunities(
    @Query() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat | false> {
    const options = {
      relations: [],
      where: {},
      order: {},
      take: '',
      skip: '',
    };
    options.take = queryParams.take || 10;
    options.skip = queryParams.skip || 0;
    let filteredIds: any[];
    if (
      queryParams.bookmarkedByMe ||
      queryParams.followedByMe ||
      queryParams.votedFor ||
      queryParams.postedByMe
    ) {
      filteredIds = await this.opportunityService.getOpportunityFilteredData({
        challenge: queryParams.challenge,
        community: queryParams.community,
        bookmarkedByMe: queryParams.bookmarkedByMe,
        followedByMe: queryParams.followedByMe,
        votedFor: queryParams.votedFor,
        postedByMe: queryParams.postedByMe,
        userData: req['userData'],
      });
      if (filteredIds.length && queryParams.id) {
        queryParams.id = [...queryParams.id, ...filteredIds];
      } else if (filteredIds.length) {
        queryParams.id = filteredIds;
      } else {
        queryParams.id = [null];
      }
    }

    if (_.get(queryParams, 'id') && typeof queryParams.id === 'object') {
      queryParams.id = In(queryParams.id);
    }
    if (
      _.get(queryParams, 'opportunityTypes') &&
      typeof queryParams.opportunityTypes === 'object'
    ) {
      queryParams.opportunityType = In(queryParams.opportunityTypes);
    }

    if (queryParams.workflow == -1) {
      queryParams.workflow = null;
    }

    let filterStatuses: [] = [];
    if (
      _.get(queryParams, 'statuses') &&
      typeof queryParams.statuses === 'object'
    ) {
      filterStatuses = queryParams.statuses.map(status => parseInt(status));
      delete queryParams.statuses;
    }
    let filterTags: [] = [];
    if (_.get(queryParams, 'tags') && typeof queryParams.tags === 'object') {
      filterTags = queryParams.tags.map(tag => parseInt(tag));
      delete queryParams.tags;
    }

    options.where = {
      ...queryParams,
    };

    /* Date Filters */
    let dateFilter = {};
    const groupedAllFollowersFinal = {};

    if (queryParams.fromDate || queryParams.toDate) {
      if (queryParams.fromDate && queryParams.toDate) {
        dateFilter = {
          createdAt: Between(
            queryParams.fromDate + ` ${TIME_LIMITS.START}`,
            queryParams.toDate + ` ${TIME_LIMITS.END}`,
          ),
        };
      } else {
        dateFilter = {
          createdAt: Between(
            queryParams.fromDate
              ? queryParams.fromDate + ` ${TIME_LIMITS.START}`
              : queryParams.toDate + ` ${TIME_LIMITS.START}`,
            queryParams.fromDate
              ? queryParams.fromDate + ` ${TIME_LIMITS.END}`
              : queryParams.toDate + ` ${TIME_LIMITS.END}`,
          ),
        };
      }
    }

    const sortClause = {};
    if (
      queryParams.sortBy &&
      queryParams.sortType &&
      queryParams.sortBy === 'createdAt'
    ) {
      sortClause[`opportunity.${queryParams.sortBy}`] = queryParams.sortType;
      options.order = {
        ...sortClause,
      };
    } else {
      if (queryParams.challenge) {
        // Finding followed challenges
        const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
          ENTITY_TYPES.CHALLENGE,
        );
        const experienceSettings = await this.entityExperienceSettingService.getEntityExperienceSetting(
          {
            where: {
              entityType: challengeEntityType.id,
              entityObjectId: queryParams.challenge,
              community: queryParams.community,
            },
          },
        );
        if (
          CHALLENGE_SORTING[experienceSettings.defaultSort] &&
          CHALLENGE_SORTING[experienceSettings.defaultSort].key
        ) {
          queryParams.sortBy =
            CHALLENGE_SORTING[experienceSettings.defaultSort].key;
          queryParams.sortType =
            CHALLENGE_SORTING[experienceSettings.defaultSort].type;

          if (
            experienceSettings.defaultSort === DefaultSort.NEWEST ||
            experienceSettings.defaultSort === DefaultSort.OLDEST
          ) {
            options.order = {
              ...sortClause,
              [queryParams.sortBy]: queryParams.sortType,
            };
          }
        } else {
          options.order = { ...sortClause, ['opportunity.id']: 'DESC' };
        }
      } else {
        sortClause['opportunity.createdAt'] = 'DESC';
        options.order = {
          ...sortClause,
        };
      }
    }
    options.where = { ...options.where, ...dateFilter };

    /* Date Filters */

    delete options.where['take'];
    delete options.where['skip'];

    const opportunities = await this.opportunityService.searchOpportunitiesWithCount(
      {
        mainTableWhereFilters: options.where,
        take: parseInt(options.take),
        skip: parseInt(options.skip),
        orderBy: options.order,
        statuses: filterStatuses,
        tags: filterTags,
      },
    );

    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    const promiseArray = [];

    _.map(opportunities[0], (val: OpportunityEntity) => {
      promiseArray.push(
        this.opportunityService.getOpportunityPermissions(
          val.id,
          req['userData'].id,
          true,
        ),
      );
    });
    const res = await Promise.all(promiseArray);
    const resGrouped = _.groupBy(res, 'opportunityId');
    _.map(opportunities[0], (valOpp, keyOpp) => {
      if (
        _.head(resGrouped[valOpp.id.toString()]).permissions.viewOpportunity ===
        PERMISSIONS_MAP.DENY
      ) {
        delete opportunities[0][keyOpp];
        opportunities[1] = opportunities[1] - 1;
      }
    });

    let resultOpportunities = opportunities[0].filter((sub: any) => {
      return !_.isEmpty(sub);
    }); // compact

    let opportunityIds = [];
    let mentionsData;
    if (resultOpportunities.length) {
      opportunityIds = _.map(resultOpportunities, 'id');
    }
    if (opportunityIds.length) {
      const mentionIds = _.flattenDeep(_.map(resultOpportunities, 'mentions'));
      const [
        commentCount,
        voteCount,
        allUpvoters,
        allmentions,
      ] = await Promise.all([
        this.opportunityService.getCommentCount(opportunityIds),
        this.opportunityService.getVoteCount(opportunityIds),
        this.voteService.getAllVote({
          where: {
            entityObjectId: In(opportunityIds),
            entityType: opportunityEntityType.id,
            voteType: VoteType.UPVOTE,
          },
          relations: ['user', 'user.profileImage'],
          order: {
            id: 'DESC',
          },
        }),
        mentionIds.length
          ? this.mentionService.getMentions({ where: { id: In(mentionIds) } })
          : [],
      ]);
      const commentCountTemp = _.groupBy(commentCount, 'opportunity_id');
      const voteCountTemp = _.groupBy(voteCount, 'opportunity_id');
      const allUpvotersGrouped = _.groupBy(allUpvoters, 'entityObjectId');
      mentionsData = _.groupBy(allmentions, 'entityObjectId');

      for (const iterator of resultOpportunities) {
        iterator['comment'] = commentCountTemp[iterator.id][0]['comment'];
        iterator['vote'] = voteCountTemp[iterator['id']][0]['vote'];
        iterator['totalUpvoteCount'] = allUpvotersGrouped[iterator.id]
          ? allUpvotersGrouped[iterator.id].length
          : 0;
        iterator['allUpvoters'] = allUpvotersGrouped[iterator.id]
          ? allUpvotersGrouped[iterator.id].map(voter => voter['user'])
          : [];
        iterator['latestUpvoters'] = allUpvotersGrouped[iterator.id]
          ? allUpvotersGrouped[iterator.id]
              .slice(0, 3)
              .map(voter => voter['user'])
          : [];
      }
    }

    if (
      queryParams.sortBy &&
      queryParams.sortType &&
      (queryParams.sortBy === 'comment' || queryParams.sortBy === 'vote')
    ) {
      const dataSorted = _.orderBy(
        resultOpportunities,
        [queryParams.sortBy],
        [queryParams.sortType.toLowerCase()],
      );
      resultOpportunities = dataSorted;
    }

    for (const iterator of resultOpportunities) {
      const bookmarkFind = await this.bookmarkService.getUserBookmarksByEntityObjectId(
        iterator.id,
        req['userData'].id,
      );
      if (!_.isEmpty(bookmarkFind)) {
        iterator['bookmark'] = true;
        iterator['bookmarkId'] = bookmarkFind[0].id;
      } else {
        iterator['bookmark'] = false;
        iterator['bookmarkId'] = '';
      }
      /* Finding Follow boolean */
      const followFind = await this.followingContentService.getUserFollowByEntityObjectId(
        opportunityEntityType.id,
        iterator.id,
        req['userData'].id,
      );
      if (!_.isEmpty(followFind)) {
        iterator['following'] = true;
        iterator['followId'] = followFind[0].id;
      } else {
        iterator['following'] = false;
        iterator['followId'] = '';
      }

      iterator.user['ideaCount'] = _.filter(
        iterator.user.opportunities,
        function(o) {
          return o.draft === false;
        },
      ).length;
      if (iterator.anonymous === 1) {
        iterator.user.firstName = 'Anonymous';
        iterator.user.lastName = '';
        iterator.user.userName = '';
        iterator.user.secondaryEmail = '';
        iterator.user.email = '';
        iterator.user.id = null;
      }
      delete iterator.user.opportunities;
    }
    const upvoteCountObject = {};
    const upvoteDataObject = {};
    let commentCounts = {};
    let ideaRleatedUserFollowingData;

    if (resultOpportunities.length) {
      const counts = await this.voteService.getTypeVoteCount(
        opportunityIds,
        ENTITY_TYPES.IDEA,
      );

      const groupedCounts = _.groupBy(counts, 'entityObjectId');
      const voteUsers = _.map(counts, 'user.id');

      for (const iterator in groupedCounts) {
        upvoteCountObject[iterator] = groupedCounts[iterator].length;
        upvoteDataObject[iterator] = groupedCounts[iterator];
      }
      let allFollowers;
      if (opportunityIds.length) {
        allFollowers = await this.followingContentService.getFollowByEntityByEntityObjectId(
          opportunityIds,
          opportunityEntityType.id,
        );
        let followerUsers = [];

        for (const iterator in allFollowers) {
          groupedAllFollowersFinal[allFollowers[iterator]['entityObjectId']] =
            allFollowers[iterator]['userFollowingContents'];
          followerUsers = [
            ...followerUsers,
            ..._.map(
              allFollowers[iterator]['userFollowingContents'],
              'user.id',
            ),
          ];
        }

        const allFollowUpvoteUsers = _.flatMap(
          _.merge(voteUsers, followerUsers),
        );
        if (allFollowUpvoteUsers.length) {
          const ideaUpvoterAndFollowersFollowing = await this.followingContentService.getUserFollowByEntityObjectIds(
            allFollowUpvoteUsers,
            req['userData'].id,
            opportunityEntityType.id,
          );
          ideaRleatedUserFollowingData = _.groupBy(
            ideaUpvoterAndFollowersFollowing,
            'entityObjectId',
          );
        }
      }

      const comments = await this.commentService.getComments({
        where: {
          entityObjectId: In(opportunityIds),
        },
      });
      commentCounts = _.countBy(comments, 'entityObjectId');
    }

    const tagsData = {};
    if (resultOpportunities.length) {
      const tagsDictionary = _.filter(
        _.uniq(_.flatMap(_.map(opportunities[0], 'tags'))),
        function(o) {
          // return validate(o);
          return o;
        },
      );
      if (tagsDictionary.length) {
        const tempTagsData = await this.tagService.getTags({
          where: { id: In(tagsDictionary) },
        });
        if (tempTagsData.length) {
          _.map(tempTagsData, (val, _key) => {
            tagsData[val.id] = val.name;
          });
        }
      }
    }
    return ResponseFormatService.responseOk(
      {
        data: resultOpportunities,
        count: opportunities[1],
        upvotes: upvoteCountObject,
        upvoteData: upvoteDataObject,
        tagsData: tagsData,
        followersData: groupedAllFollowersFinal,
        ideaRleatedUserFollowingData: ideaRleatedUserFollowingData,
        commentCounts: commentCounts,
        mentionsData: mentionsData || [],
      },
      'All',
    );
  }

  @Get('permissions')
  async getOpportunityPermissions(
    @Query('id') id,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const permissions = await this.opportunityService.getOpportunityPermissions(
      id,
      req['userData'].id,
    );
    return ResponseFormatService.responseOk(permissions, 'All');
  }

  @Post('bulk-permissions')
  async getBulkOpportunityPermissions(
    @Body() body: GetBulkOpportunityPermissionsDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const permissions = await Promise.all(
      body.opportunities.map(opportunity =>
        this.opportunityService.getOpportunityPermissions(
          opportunity,
          req['userData'].id,
          true,
        ),
      ),
    );
    return ResponseFormatService.responseOk(permissions, 'All Permissions');
  }

  @Post('bulk-visibility-settings')
  async getBulkVisbilitySettings(
    @Body() body: GetBulkOpportunityPermissionsDto,
  ): Promise<ResponseFormat> {
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    const entityVisibilitySettings = await this.entityVisibilitySettingService.getEntityVisibilitySettings(
      {
        where: {
          entityObjectId: In(body.opportunities),
          entityType: oppEntityType,
        },
      },
    );
    return ResponseFormatService.responseOk(
      entityVisibilitySettings,
      'All visibility settings.',
    );
  }

  @Get('current-stage-assignees/:id')
  async getCurrentStageAssignee(@Param('id') id): Promise<ResponseFormat> {
    const assignees = await this.opportunityService.getCurrentStageAssignees(
      id,
    );
    return ResponseFormatService.responseOk(assignees, 'All');
  }

  @Post('current-stage-assignees')
  async getOppStageAssigneesInBulk(@Body()
  body: {
    opportunityIds: [];
  }): Promise<ResponseFormat> {
    const currentAssigneePromise = [];
    _.map(body.opportunityIds, res => {
      currentAssigneePromise.push(
        this.opportunityService.getCurrentStageAssignees(res, true),
      );
    });
    let assigneesData = await Promise.all(currentAssigneePromise);
    assigneesData = _.flatten(_.compact(assigneesData));

    return ResponseFormatService.responseOk(assigneesData, 'All');
  }

  @Post('assignees-count')
  async getAssigneesCount(
    @Body() body: GetAssigneesCountDto,
  ): Promise<ResponseFormat> {
    const assignees = await this.opportunityService.getAssigneesFromSettings(
      body.opportunity,
      body.assigneeSettings,
    );
    return ResponseFormatService.responseOk(
      { count: assignees.length },
      'Assignees Count',
    );
  }
  @Post('get-opportunity-data')
  async getAllOpportunitiesNew(
    // @Body() body: GetOpportunityDataBodyDto,
    @Body() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const responseData = await this.sharedService.getAllOpportunities(
      queryParams,
      req,
    );

    return ResponseFormatService.responseOk(responseData, 'All Opportunities');
  }
  @Post('get-opportunity-details')
  async getOpportunitiesDetailsNew(
    @Body() body: GetOpportunityDataDetailBodyDto,
    @Query() queryParams,
  ): Promise<ResponseFormat> {
    const whereParams = {};
    if (body.opportunityIds.length) {
      whereParams['id'] = In(body.opportunityIds);
    }
    whereParams['community'] = body.community;
    let updatedParams = {};
    _.map(queryParams, (val, key) => {
      updatedParams = { ...updatedParams, ...{ [key]: parseInt(val) } };
    });
    const opportunities = await this.opportunityService.searchOpportunitiesDetailsOptimize(
      { ...updatedParams, whereClause: whereParams },
    );
    const tagsData = {};

    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    // Getting Tags Data
    if (updatedParams['tags'] && opportunities.length) {
      const tagsDictionary = _.filter(
        _.uniq(_.flatMap(_.map(opportunities, 'tags'))),
        function(o) {
          // return validate(o);
          return o;
        },
      );
      if (tagsDictionary.length) {
        const tempTagsData = await this.tagService.getTags({
          where: { id: In(tagsDictionary) },
        });
        if (tempTagsData.length) {
          _.map(tempTagsData, (val, _key) => {
            tagsData[val.id] = val.name;
          });
        }
      }
    }
    const upvoteCountObject = {};
    const upvoteDataObject = {};
    let commentCounts = {};
    const groupedAllFollowersFinal = {};
    let mentionsData;
    let stageAssignmentSettings;
    // Getting Upvote Count
    if (updatedParams['upvoteCount']) {
      const counts = await this.voteService.getTypeVoteCount(
        body.opportunityIds,
        ENTITY_TYPES.IDEA,
      );
      const groupedCounts = _.groupBy(counts, 'entityObjectId');

      for (const iterator in groupedCounts) {
        upvoteCountObject[iterator] = groupedCounts[iterator].length;
      }
    }
    // Getting Upvote Data
    if (updatedParams['upvoteData']) {
      const counts = await this.voteService.getTypeVoteCount(
        body.opportunityIds,
        ENTITY_TYPES.IDEA,
      );
      const groupedCounts = _.groupBy(counts, 'entityObjectId');

      for (const iterator in groupedCounts) {
        upvoteDataObject[iterator] = groupedCounts[iterator];
      }
    }
    // Getting Comment Count
    if (updatedParams['commentCount']) {
      const comments = await this.commentService.getComments({
        where: {
          entityObjectId: In(body.opportunityIds),
        },
      });
      commentCounts = _.countBy(comments, 'entityObjectId');
    }
    // Getting Followers Data
    if (updatedParams['followersData']) {
      const allFollowers = await this.followingContentService.getFollowByEntityByEntityObjectId(
        body.opportunityIds,
        opportunityEntityType.id,
      );
      let followerUsers = [];

      for (const iterator in allFollowers) {
        groupedAllFollowersFinal[allFollowers[iterator]['entityObjectId']] =
          allFollowers[iterator]['userFollowingContents'];
        followerUsers = [
          ...followerUsers,
          ..._.map(allFollowers[iterator]['userFollowingContents'], 'user.id'),
        ];
      }
    }
    // Getting Mentions
    if (updatedParams['mentions']) {
      const mentionIds = _.flattenDeep(_.map(opportunities, 'mentions'));
      if (mentionIds.length) {
        const allMentions = await this.mentionService.getMentions({
          where: { id: In(mentionIds) },
        });
        mentionsData = _.groupBy(allMentions, 'entityObjectId');
      }
    }

    // Getting Stage Settings
    if (updatedParams['stageAssignmentSettings']) {
      const assSettings = await this.stageAssignmentSettingService.getStageAssignmentSettings(
        {
          entityObjectId: In(body.opportunityIds),
          entityType: opportunityEntityType,
        },
      );
      stageAssignmentSettings = _.groupBy(assSettings, 'entityObjectId');
      stageAssignmentSettings = _.forEach(
        stageAssignmentSettings,
        (val, key) => {
          stageAssignmentSettings[key] = _.head(val);
        },
      );
    }

    return ResponseFormatService.responseOk(
      {
        data: opportunities,
        tagsData: tagsData,
        commentCounts: commentCounts,
        followersData: groupedAllFollowersFinal,
        mentionsData: mentionsData || [],
        upvoteData: upvoteDataObject,
        upvotes: upvoteCountObject,
        ...(stageAssignmentSettings && { stageAssignmentSettings }),
      },
      'All Opportunities Details',
    );
  }

  @Post('stage-notifiable-users-count')
  async getStageNotfiableUsersCount(
    @Body() body: GetStageNotifiableUsersCountDto,
  ): Promise<ResponseFormat> {
    const notifiableUsers = await this.opportunityService.getNotifiableUsersFromSettings(
      body.opportunity,
      body.notificationSettings,
    );
    return ResponseFormatService.responseOk(
      { count: notifiableUsers.length },
      'Notifiable Users Count',
    );
  }

  @Get('opportunity-status')
  /**
   * Get Statuses Counts against Opportunities
   * @param Query
   * @return List Of Statuses With Counts Against Opportunities
   */
  async getOpportunityStatus(
    @Query('community') community,
    @Query('challenge') challenge,
    @Query('user') user,
  ): Promise<ResponseFormat> {
    const opportunityStatus = await this.opportunityService.getOpportunityStatus(
      { community: community, challenge: challenge, user: user },
    );
    return ResponseFormatService.responseOk(
      opportunityStatus,
      'All Statsues Count Against Opportunities',
    );
  }

  @Get('filter-counts')
  async getOpportunityFilterCounts(
    @Query()
    queryParams: FilterCountsDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    let whereClause = {
      community: queryParams.community,
    };
    if (queryParams.challenge) {
      whereClause = { ...{ challenge: queryParams.challenge }, ...whereClause };
    }
    const challengeOpportunities = await this.opportunityService.getOpportunities(
      {
        where: whereClause,
        relations: ['user'],
      },
    );
    const allOpportunitites = [];
    const postedByMeOpportunities = [];
    const tagsByOpportunity = {};
    let totalUniqueTags = [];
    _.mapKeys(challengeOpportunities, (val: OpportunityEntity) => {
      if (val.tags.length) {
        tagsByOpportunity[val.id] = val.tags;
        totalUniqueTags.push(val.tags);
      }
      allOpportunitites.push(val.id);
      if (val.user.id === req['userData'].id) {
        postedByMeOpportunities.push(val.id);
      }
    });
    totalUniqueTags = _.uniq(_.flatMap(totalUniqueTags));
    const finalTagsData = {};
    if (totalUniqueTags.length) {
      const opportunityAllTags = await this.tagService.getTags({
        where: { id: In(totalUniqueTags) },
      });
      _.mapKeys(opportunityAllTags, (__val: TagEntity) => {
        _.map(tagsByOpportunity, (_val, _key) => {
          if (_.indexOf(_val, __val.id) > -1) {
            if (finalTagsData[__val.name]) {
              finalTagsData[__val.name]['count'] =
                finalTagsData[__val.name]['count'] + 1;
              //   finalTagsData[__val.name]['ids'].push(_key);
              finalTagsData[__val.name]['id'] = __val.id;
            } else {
              finalTagsData[__val.name] = {
                count: 1,
                // ids: [_key]
                id: __val.id,
              };
            }
          }
        });
      });
    }
    let bookmarks;
    let follows;
    let votes;
    let opportunityTypes;
    if (allOpportunitites.length) {
      bookmarks = await this.bookmarkService.getBookmarkCounts(
        queryParams.user || req['userData'].id,
        queryParams.entityType,
        allOpportunitites,
      );
      follows = await this.followingContentService.getFollowingCounts(
        queryParams.user || req['userData'].id,
        queryParams.entityType,
        allOpportunitites,
      );
      votes = await this.voteService.getVoteCounts(
        queryParams.user || req['userData'].id,
        queryParams.entityType,
        allOpportunitites,
      );
      opportunityTypes = await this.opportunityService.getOpportunityCountByType(
        allOpportunitites,
      );
    }

    const finalOpportunityTypes = {};
    if (opportunityTypes) {
      _.map(opportunityTypes, val => {
        finalOpportunityTypes[val.opportunitytype] = {
          //   ids: val.ids,
          id: parseInt(val.opportunitytypeid),
          count: parseInt(val.count),
        };
      });
    }
    const finalResponseObject = {
      bookmarkedByMe: !_.isEmpty(bookmarks) ? bookmarks[0] : {},
      followedByMe: !_.isEmpty(follows) ? follows[0] : {},
      votedFor: !_.isEmpty(votes) ? votes[0] : {},
      postedByMe: postedByMeOpportunities.length
        ? {
            // ids: postedByMeOpportunities,
            count: postedByMeOpportunities.length,
          }
        : {},
      tags: finalTagsData,
      opportunityTypes: finalOpportunityTypes,
    };
    return ResponseFormatService.responseOk(
      finalResponseObject,
      'Filter Counts',
    );
  }
  @Get('similar-opportunities')
  async getSimilarOpportunities(
    @Query()
    queryParams: SimilarOpportunitiesDto,
  ): Promise<ResponseFormat> {
    const options = { relations: [] };
    options.relations = ['opportunityType'];
    const similarOpportunities = await this.opportunityService.getSimilarOpportunities(
      { title: queryParams.title },
      queryParams.community,
    );
    return ResponseFormatService.responseOk(
      similarOpportunities,
      'Similar Opportunities',
    );
  }

  @Get(':id')
  async getOpportunity(@Param('id') id: string): Promise<ResponseFormat> {
    const options = { relations: [], where: {} };
    options.relations = [
      'opportunityType',
      'opportunityAttachments',
      'stage',
      'stage.actionItem',
      'stage.status',
      'workflow',
    ];
    options.where = { id: id };
    const opportunity = await this.opportunityService.getOpportunities(options);
    return ResponseFormatService.responseOk(opportunity, 'All');
  }
  @Get(':id/opportunity-field-data')
  async getOpportunityFieldData(
    @Param('id') id: string,
  ): Promise<ResponseFormat> {
    const options = { relations: [], where: {} };
    options.relations = ['opportunity'];
    options.where = { opportunity: id };
    const opportunity = await this.customFieldDataService.getCustomFieldData(
      options,
    );
    return ResponseFormatService.responseOk(
      opportunity,
      'Opportunity Field Data',
    );
  }
  @Get(':id/stage-completion-stats')
  async getStageCompletionForOpportunity(
    @Param('id') id: string,
  ): Promise<ResponseFormat> {
    const options = { relations: ['stage', 'stage.actionItem'], where: {} };
    options.where = { id: id };
    const opportunity = await this.opportunityService.getOneOpportunity(
      options,
    );

    const stageEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.STAGE,
    );
    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    const dataForOpportunity = await this.stageAssignmentSettingService.getStageAssignmentSettings(
      {
        entityObjectId: id,
        entityType: opportunityEntityType.id,
      },
    );

    let finalData = { total: 0, completed: 0 };

    if (
      opportunity.stage &&
      opportunity.stage.actionItem.abbreviation ===
        ACTION_ITEM_ABBREVIATIONS.REFINEMENT
    ) {
      // Calculating stage completion for Refinement stage.
      const dataForCustomFieldIntegrations = await this.customFieldIntegrationService.getCustomFieldIntegrations(
        {
          entityObjectId: opportunity.stageId,
          entityType: stageEntityType,
          community: opportunity.communityId,
        },
      );
      const fieldIds = _.map(dataForCustomFieldIntegrations, 'fieldId');
      let customFieldData = [];
      if (fieldIds.length) {
        customFieldData = await this.customFieldDataService.getCustomFieldData({
          where: { field: In(fieldIds), opportunity: id },
        });
      }

      const totalAttachedFieldsWithStage =
        dataForCustomFieldIntegrations.length;
      const totalCompletedFieldsOfCurrentOpportunityUnderStage =
        customFieldData.length;

      const totalForCompletion = dataForOpportunity[0].allAssigneesCompleted
        ? totalAttachedFieldsWithStage
        : _.min([
            dataForOpportunity[0].minimumResponses,
            totalAttachedFieldsWithStage,
          ]);
      finalData = {
        total: totalForCompletion,
        completed: _.min([
          totalCompletedFieldsOfCurrentOpportunityUnderStage,
          totalForCompletion,
        ]),
      };
    } else if (
      opportunity.stage &&
      opportunity.stage.actionItem.abbreviation ===
        ACTION_ITEM_ABBREVIATIONS.SCORECARD
    ) {
      const options = {
        where: {
          opportunity: opportunity,
          entityType: stageEntityType,
          entityObjectId: opportunity.stageId,
          community: opportunity.communityId,
        },
      };
      // Calculating stage completion for Scorecard stage.
      const responses = await this.opportunityEvaluationResponseService.getOpportunityEvaluationResponses(
        options,
      );
      const uniqResp = _.uniqBy(responses, 'userId');

      const stageAssignees = await this.opportunityService.getCurrentStageAssignees(
        parseInt(id),
      );

      const responsesCount = uniqResp.length;
      const totalResponses = dataForOpportunity[0].allAssigneesCompleted
        ? stageAssignees.length
        : _.min([
            dataForOpportunity[0].minimumResponses,
            stageAssignees.length,
          ]);

      finalData = {
        completed: _.min([responsesCount, totalResponses]),
        total: totalResponses,
      };
    }

    return ResponseFormatService.responseOk(
      finalData,
      'Opportunity Field Data',
    );
  }
  @Post('stage-completion-stats')
  async getStageCompletionForOpportunities(@Body()
  body: {
    opportunityIds: [];
  }): Promise<ResponseFormat> {
    const options = { relations: ['stage', 'stage.actionItem'], where: {} };
    options.where = { id: In(body.opportunityIds) };
    const opportunity = await this.opportunityService.getOpportunities(options);

    const stageEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.STAGE,
    );
    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    const stageCompletionPromiseArr = [];
    _.map(opportunity, val => {
      stageCompletionPromiseArr.push(
        this.opportunityService.stageCompletionStats(
          val,
          stageEntityType,
          opportunityEntityType,
        ),
      );
    });
    let dataForCompletion = await Promise.all(stageCompletionPromiseArr);
    dataForCompletion = _.compact(dataForCompletion);
    return ResponseFormatService.responseOk(
      dataForCompletion,
      'Opportunity Field Data',
    );
  }

  @Patch(':id')
  async updateOpportunity(
    @Param('id') id,
    @Body() body: EditOpportunityDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    if (body.attachments && body.attachments.length > 0) {
      await this.opportunityAttachmentService.deleteOpportunityAttachment({
        opportunity: id,
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
            isSelected: val.isSelected ? 1 : 0,
            opportunity: id,
            opportunityType: body.opportunityType,
            isDeleted: false,
            size: val.size,
            userAttachment: val.userAttachment,
          });
        },
      );
      await this.opportunityAttachmentService.addOpportunityAttachment(
        newAttachmentsData,
      );
    } else if (!body.viewCount && !body.stage) {
      await this.opportunityAttachmentService.deleteOpportunityAttachment({
        opportunity: id,
      });
    }

    const oppoEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    const opportunityDataCurent = await this.opportunityService.getOneOpportunity(
      { relations: ['stage', 'community', 'workflow'], where: { id: id } },
    );

    if (body.stage) {
      if (body.assigneeSettings) {
        body.assigneeSettings = this.opportunityService.checkAssigneeAllMembersUnassingedRequest(
          body.assigneeSettings,
        );
      }
      if (body.stageActivityVisibilitySettings) {
        body.stageActivityVisibilitySettings = this.opportunityService.checkAssigneeAllMembersUnassingedRequest(
          body.stageActivityVisibilitySettings,
        );
      }

      const actorData = {
        ...req['userData'],
        community: opportunityDataCurent.communityId,
      };
      const actionData = {
        ...opportunityDataCurent,
        entityObjectId: opportunityDataCurent.id,
        entityType: oppoEntityType.id,
      };

      if (
        body.stage &&
        opportunityDataCurent.stage &&
        opportunityDataCurent.stage.id &&
        opportunityDataCurent.stage.id === body.stage
      ) {
        await this.opportunityService.editOpportunityStageData(
          body,
          id,
          opportunityDataCurent.community.id,
        );
      } else {
        const stageEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
          ENTITY_TYPES.STAGE,
        );
        const newStage = await this.stageService.getOneStage({
          where: { id: body.stage },
          relations: ['actionItem'],
        });

        if (opportunityDataCurent.stage) {
          const stageData = await this.stageService.getOneStage({
            where: { id: opportunityDataCurent.stage.id },
            relations: ['actionItem'],
          });

          const computeObject = await this.evaluationCriteriaService.getEvaluationsEntityScores(
            {
              entityObjectId: opportunityDataCurent.stage.id,
              entityType: stageEntityType.id,
              opportunity: opportunityDataCurent.id,
              community: opportunityDataCurent.communityId,
            },
          );
          NotificationHookService.addStageHistory({
            oldStageData: {
              actionItem: stageData.actionItem,
              stage: opportunityDataCurent.stage,
              opportunity: opportunityDataCurent,
              computeObject: computeObject,
              exitingAt: moment().format(),
              community: opportunityDataCurent.community,
            },
          });

          NotificationHookService.addCriteriaFinalScores({
            criteriaScores: computeObject.criteriaScores,
            opportunity: opportunityDataCurent.id,
            entityType: stageEntityType.id,
            entityObjectId: opportunityDataCurent.stage.id,
          });

          if (opportunityDataCurent.workflowId === body.workflow) {
            // Change Stage Notification
            this.opportunityService.generateUpdateStageNotification({
              opportunity: opportunityDataCurent,
              stageNotificationSettings: body.stageNotificationSettings,
              actionData,
              actorData,
              actionType: ACTION_TYPES.CHANGE_STAGE,
              oldStage: stageData,
              newStage,
            });
          } else {
            // Change Workflow Notification
            const newWorkflow = await this.workflowService.getOneWorkflow({
              where: { id: body.workflow },
            });
            this.opportunityService.generateUpdateStageNotification({
              opportunity: opportunityDataCurent,
              stageNotificationSettings: body.stageNotificationSettings,
              actionData,
              actorData,
              actionType: ACTION_TYPES.CHANGE_WORKFLOW,
              oldStage: stageData,
              newStage,
              oldWorkflow: opportunityDataCurent.workflow,
              newWorkflow,
            });
          }
        } else {
          const stageData = await this.stageService.getOneStage({
            where: { id: body.stage },
          });
          const computeObject = await this.evaluationCriteriaService.getEvaluationsEntityScores(
            {
              entityObjectId: stageData.id,
              entityType: stageEntityType.id,
              opportunity: opportunityDataCurent.id,
              community: opportunityDataCurent.communityId,
            },
          );
          NotificationHookService.addStageHistory({
            oldStageData: {
              actionItem: stageData.actionItem,
              stage: stageData,
              opportunity: opportunityDataCurent,
              computeObject: computeObject,
              enteringAt: moment().format(),
              community: opportunityDataCurent.community,
            },
          });

          // Add Workflow Notification
          const newWorkflow = await this.workflowService.getOneWorkflow({
            where: { id: body.workflow },
          });
          this.opportunityService.generateUpdateStageNotification({
            opportunity: opportunityDataCurent,
            stageNotificationSettings: body.stageNotificationSettings,
            actionData,
            actorData,
            actionType: ACTION_TYPES.ADD_WORKFLOW,
            newStage,
            newWorkflow,
          });
        }
        body['stageAttachmentDate'] = moment().format('YYYY-MM-DD');
        await this.opportunityService.addOpportunityStageData(
          body,
          id,
          opportunityDataCurent.community.id,
        );
      }
    }

    delete body.attachments;
    delete body.assigneeSettings;
    // delete body.stageAssignmentSettings;
    delete body.stageNotificationSettings;
    delete body.stageActivityVisibilitySettings;
    const originUrl = req.headers.origin;
    const updateData = await this.opportunityService.updateOpportunity(
      { id: id },
      body,
      req['userData'],
      originUrl,
    );
    const options = {
      relations: [],
      where: { id: id },
    };
    if (updateData['affected']) {
      options.relations = [
        'community',
        'user',
        'opportunityType',
        'opportunityAttachments',
        'opportunityAttachments.userAttachment',
        'user.profileImage',
        'user.opportunities',
        'user.opportunities.opportunityType',
      ];
      const opportunity = await this.opportunityService.getOpportunities(
        options,
      );
      if (opportunity[0].anonymous === 1) {
        opportunity[0].user.firstName = 'Anonymous';
        opportunity[0].user.lastName = '';
        opportunity[0].user.userName = '';
        opportunity[0].user.secondaryEmail = '';
        opportunity[0].user.email = '';
        opportunity[0].user.id = null;
      }
      updateData['updatedData'] = opportunity[0];
    }
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Patch('increase-view-count/:id')
  async increaseViewCount(
    @Param('id') id: string,
    @Body() body: IncreaseViewCountOpportunityDto,
  ): Promise<ResponseFormat> {
    const updateData = await this.opportunityService.increaseViewCount(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(
      updateData,
      'View Count Increased Successfully',
    );
  }

  @Patch(':id/opportunity-field-data/:opportunityFieldId')
  async updateOpportunityFieldData(
    @Param('id') id,
    @Param('opportunityFieldId') opportunityFieldId,
    @Body() body: AddOpportunityFieldDataDto,
  ): Promise<ResponseFormat> {
    const oldDataObjectMain = await this.customFieldDataService.getCustomFieldData(
      {
        where: {
          opportunity: id,
          id: opportunityFieldId,
        },
      },
    );
    if (oldDataObjectMain.length) {
      if (oldDataObjectMain[0].history) {
        body['history'] = {
          ...oldDataObjectMain[0].history,
          ...{
            [moment().format()]: oldDataObjectMain[0].fieldData,
          },
        };
      } else {
        body['history'] = {
          [moment().format()]: oldDataObjectMain[0].fieldData,
        };
      }
      const updatedData = await this.customFieldDataService.simpleUpdateCustomFieldData(
        {
          id: opportunityFieldId,
          opportunity: id,
        },
        body,
      );
      return ResponseFormatService.responseOk(
        updatedData,
        'Data updated successfully',
      );
    } else {
      throw new NotFoundException();
    }
  }

  @Delete('')
  async removeOpportunity(@Body() ids: []): Promise<ResponseFormat> {
    const deleteResponse = await this.opportunityService.updateOpportunityBulk(
      { id: In(ids) },
      { isDeleted: true },
    );
    return ResponseFormatService.responseOk(
      deleteResponse,
      'Opportunity Deleted Successfully',
    );
  }
}
