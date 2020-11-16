import { Injectable } from '@nestjs/common';
import { OpportunityRepository } from './opportunity.repository';
import { OpportunityEntity } from './opportunity.entity';
import { Brackets, In, getRepository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import * as _ from 'lodash';
import { CommunityWisePermissionEntity } from '../communityWisePermission/communityWisePermission.entity';
import { RoleActorsService } from '../roleActors/roleActors.service';
import { EntityTypeService } from '../entityType/entity.service';
import { EntityExperienceSettingService } from '../entityExperienceSetting/entityExperienceSetting.service';
import {
  ACTION_TYPES,
  ENTITY_TYPES,
  PERMISSIONS_MAP,
  TABLES,
  MENTION_TYPES,
  ROLE_ABBREVIATIONS,
  CUSTOM_FIELD_TYPE_ABBREVIATIONS,
  REMINDER_FREQUENCY_MAPPING,
  ACTION_ITEM_ABBREVIATIONS,
} from '../../common/constants/constants';
import { CommunityActionPoints } from '../../shared/services/communityActionPoint.service';
import { UtilsService } from '../../providers/utils.service';
import { EntityVisibilitySettingService } from '../entityVisibilitySetting/entityVisibilitySetting.service';
import { RolesEnum } from '../../enum/roles.enum';
import { RoleService } from '../role/role.service';
import { UserCircles } from '../user/user.circles.entity';
import { OpportunityUserService } from '../opportunityUser/opportunityUser.service';
import { OpportunityUserType } from '../../enum/opportunity-user-type.enum';
import { EntityMetaService } from '../../shared/services/EntityMeta.service';
import { NotificationHookService } from '../../shared/services/notificationHook';
import { FollowingContentService } from '../followingContent/followingContent.service';
import { MentionService } from '../mention/mention.service';
import { StageAssignmentSettingService } from '../stage/stageAssignmentSettings.service';
import { StageNotificationSettingService } from '../stage/stageNotificationSetting.service';
import { StageAssigneeService } from '../stage/stageAssigneeSettings.service';
import { CommunityService } from '../community/community.service';
import { StageAssigneeSettingsTypeEnum } from '../../enum/stage-assignee-settings.enum';
import { UserService } from '../user/user.service';
import { RoleActorTypes, VoteType } from '../../enum';
import { CircleService } from '../circle/circle.service';
import * as camelcaseKeys from 'camelcase-keys';
import { OpportunityUserEntity } from '../opportunityUser/opportunityUser.entity';
import { CustomFieldDataService } from '../customField/customFieldData.service';
import { CommunityEntity } from '../community/community.entity';
import { OpportunityFieldLinkageService } from '../customField/opportunityFieldLinkage.service';
import { CustomFieldIntegrationService } from '../customField/customFieldIntegration.service';
import { FieldIntegrationTypeEnum } from '../../enum/field-integration-type.enum';
import * as moment from 'moment-timezone';
import { EntityTypeEntity } from '../entityType/entity.entity';
import { AddStageAssignmentSettingsDto } from '../workflow/dto/AddStageAssignmentSettingsDto';
import { AddStageAssigneeSettingsDto } from '../workflow/dto/AddStageAssigneeSettingsDto';
import { StageAssigneeSettingsInterface } from '../stage/interface';
import { StageNotificationSettingsInterface } from '../stage/interface/stageNotificationSettings.interface';
import { VoteService } from '../vote/vote.service';
import { StageEntity } from '../stage/stage.entity';
import { EvaluationCriteriaService } from '../evaluationCriteria/evaluationCriteria.service';
import { WorkflowEntity } from '../workflow/workflow.entity';
import { ElasticSearchService } from '../../shared/services/elasticSearchHook';
import { OpportunityEvaluationResponseService } from '../evaluationCriteria/opportunityEvaluationResponse.service';
import { BookmarkService } from '../bookmark/bookmark.service';

@Injectable()
export class OpportunityService {
  constructor(
    public readonly opportunityRepository: OpportunityRepository,
    public readonly roleActorService: RoleActorsService,
    public readonly entityTypeService: EntityTypeService,
    public readonly entityExperienceSettingService: EntityExperienceSettingService,
    public readonly entityVisibilitySettingService: EntityVisibilitySettingService,
    public readonly roleService: RoleService,
    public readonly opportunityUserService: OpportunityUserService,
    public readonly followingContentService: FollowingContentService,
    public readonly mentionService: MentionService,
    public readonly stageAssigneeService: StageAssigneeService,
    public readonly stageNotificationSettingService: StageNotificationSettingService,
    public readonly stageAssignmentSettingService: StageAssignmentSettingService,
    public readonly communityService: CommunityService,
    public readonly userService: UserService,
    public readonly circleService: CircleService,
    public readonly customFieldDataService: CustomFieldDataService,
    public readonly opportunityFieldLinkageService: OpportunityFieldLinkageService,
    public readonly customFieldIntegrationService: CustomFieldIntegrationService,
    public readonly roleActorsService: RoleActorsService,
    public readonly voteService: VoteService,
    public readonly evaluationCriteriaService: EvaluationCriteriaService,
    public readonly elasticSearchService: ElasticSearchService,
    private readonly opportunityEvaluationResponseService: OpportunityEvaluationResponseService,
    private readonly bookmarkService: BookmarkService,
  ) {}

  async getCommentCount(opportunityIds) {
    return this.opportunityRepository
      .createQueryBuilder('opportunity')
      .select([
        'count(comment.id) AS comment',
        'opportunity.id',
        'opportunity.challenge',
      ])
      .leftJoin(
        'comment',
        'comment',
        'comment.entity_object_id::numeric = opportunity.id::numeric',
      )
      .where('opportunity.id IN (:...opportunityIds)', {
        opportunityIds: opportunityIds,
      })
      .groupBy('opportunity.id') //

      .getRawMany();
  }

  async getOpportunityPermissions(
    opportunityId: number,
    userId: number,
    returnWithOpportunityId?: boolean,
  ): Promise<CommunityWisePermissionEntity | {}> {
    const options = { userId };
    const opportunity = await this.getOneOpportunity({ id: opportunityId });
    const permissions = await this.roleActorService.getEntityPermissions(
      null,
      null,
      opportunity.communityId,
      options,
    );
    const otherPermissions = [];

    const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    if (opportunity.challengeId) {
      otherPermissions.push(
        await this.roleActorService.getEntityPermissions(
          opportunity.challengeId,
          challengeEntityType.id,
          opportunity.communityId,
          options,
        ),
      );
    }

    otherPermissions.push(
      await this.roleActorService.getEntityPermissions(
        opportunityId,
        oppEntityType.id,
        opportunity.communityId,
        options,
      ),
    );
    for (const permProperty of Object.getOwnPropertyNames(permissions)) {
      for (const perm of otherPermissions) {
        permissions[permProperty] = Math.max(
          permissions[permProperty],
          perm[permProperty],
        );
      }
    }

    // checking visibility settings for viewing permissions
    if (permissions.viewOpportunity === PERMISSIONS_MAP.SCENARIO) {
      const visibilityPermissions = await this.entityVisibilitySettingService.getEntityVisibilitySetting(
        {
          where: {
            entityObjectId: opportunityId,
            entityType: oppEntityType.id,
          },
        },
      );
      if (!visibilityPermissions) {
        // if no visibility settings present, default to public
        permissions.viewOpportunity = PERMISSIONS_MAP.ALLOW;
      } else {
        // if opportunity is public then allow viewing
        if (visibilityPermissions.public) {
          permissions.viewOpportunity = PERMISSIONS_MAP.ALLOW;
        }

        // if any of user's groups is in the opportunity's visibility settings'
        // groups then allow viewing
        if (
          permissions.viewOpportunity === PERMISSIONS_MAP.SCENARIO &&
          visibilityPermissions.groups &&
          visibilityPermissions.groups.length
        ) {
          const userCirclesRepository = getRepository(UserCircles);
          const userCircles = await userCirclesRepository.find({
            select: ['circleId'],
            where: {
              userId: userId,
            },
          });
          const userFoundCircles = _.map(userCircles, 'circleId');
          const diff = _.difference(
            visibilityPermissions.groups,
            userFoundCircles,
          );
          if (diff.length < visibilityPermissions.groups.length) {
            permissions.viewOpportunity = PERMISSIONS_MAP.ALLOW; // show
          }
        }

        // if user is in the opportunity's visibility settings' individuals
        // then allow viewing
        if (
          permissions.viewOpportunity === PERMISSIONS_MAP.SCENARIO &&
          visibilityPermissions.individuals &&
          visibilityPermissions.individuals.length
        ) {
          const diff = _.difference(visibilityPermissions.individuals, [
            userId,
          ]);
          if (diff.length < visibilityPermissions.individuals.length) {
            permissions.viewOpportunity = PERMISSIONS_MAP.ALLOW; // show
          }
        }

        // if user is in the opportunity's visibility settings' roles
        // then allow viewing
        if (
          permissions.viewOpportunity === PERMISSIONS_MAP.SCENARIO &&
          visibilityPermissions.roles &&
          visibilityPermissions.roles.length
        ) {
          let roles = (await this.roleActorService.getMyEntityRoles(
            opportunity.id,
            oppEntityType.id,
            opportunity.communityId,
            { user: userId },
          )).map(roleActor => roleActor.roleId);

          if (opportunity.challengeId) {
            const challengeRoles = (await this.roleActorService.getMyEntityRoles(
              opportunity.challengeId,
              challengeEntityType.id,
              opportunity.communityId,
              { user: userId },
            )).map(roleActor => roleActor.roleId);
            roles = [...roles, ...challengeRoles];
          }

          roles = _.uniq(roles);

          const diff = _.difference(visibilityPermissions.roles, roles);
          if (diff.length < visibilityPermissions.roles.length) {
            permissions.viewOpportunity = PERMISSIONS_MAP.ALLOW; // show
          }
        }

        // if user doesn't come under any visibility settings then deny viewing
        if (permissions.viewOpportunity === PERMISSIONS_MAP.SCENARIO) {
          permissions.viewOpportunity = PERMISSIONS_MAP.DENY; // dont show
        }
      }
    }
    permissions.editOpportunity = UtilsService.checkScenarioPermission(
      permissions.editOpportunity,
      opportunity.userId === userId,
    );

    const oppExpSettings = await this.entityExperienceSettingService.getEntityExperienceSetting(
      {
        where: {
          entityObjectId: opportunityId,
          entityType: oppEntityType.id,
          community: opportunity.communityId,
        },
      },
    );
    permissions.voteOpportunity = UtilsService.checkScenarioPermission(
      permissions.voteOpportunity,
      oppExpSettings.allowVoting,
    );
    permissions.shareOpportunity = UtilsService.checkScenarioPermission(
      permissions.shareOpportunity,
      oppExpSettings.allowSharing,
    );
    permissions.postComments = UtilsService.checkScenarioPermission(
      permissions.postComments,
      oppExpSettings.allowCommenting,
    );

    // Stage specific tab permissions.
    if (permissions.viewStageSpecificTab === PERMISSIONS_MAP.SCENARIO) {
      if (opportunity.stageId) {
        const stageAssignees = await this.getCurrentStageAssignees(
          opportunity.id,
        );
        const assigneeIds = stageAssignees.map(assignee => assignee['id']);
        if (assigneeIds.includes(userId)) {
          permissions.viewStageSpecificTab = PERMISSIONS_MAP.ALLOW;
        } else {
          permissions.viewStageSpecificTab = PERMISSIONS_MAP.DENY;
        }
      } else {
        permissions.viewStageSpecificTab = PERMISSIONS_MAP.DENY;
      }
    }

    if (returnWithOpportunityId) {
      return { opportunityId: opportunityId, permissions: permissions };
    }
    return permissions;
  }

  async getVoteCount(opportunityIds, voteType?: string): Promise<{}> {
    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    return this.opportunityRepository
      .createQueryBuilder('opportunity')
      .select([
        'count(vote.id) AS vote',
        'opportunity.id',
        'opportunity.challenge',
      ])
      .leftJoin(
        'vote',
        'vote',
        `vote.entity_object_id::numeric = opportunity.id::numeric AND vote.entity_type_id = :entityType ${
          voteType ? `AND vote.vote_type = '${voteType}'` : ''
        }`,
        {
          entityType: opportunityEntityType.id,
        },
      )
      .where('opportunity.id IN (:...opportunityIds)', {
        opportunityIds: opportunityIds,
      })
      .groupBy('opportunity.id') //
      .getRawMany();
  }

  /* FILTER OPPORTUNITIES */
  async filterOpportunities(options: { take: any; skip: any }) {
    const subquery = await this.opportunityRepository.createQueryBuilder(
      'opportunityAttachments',
    );
    options.take = options.take || 30;
    options.skip = options.skip || 0;
    return (
      this.opportunityRepository
        .createQueryBuilder('opportunity')
        // .leftJoinAndSelect('opportunity.community', 'community')
        // .leftJoinAndSelect('opportunity.user', 'user')
        .leftJoinAndSelect(
          'opportunity.opportunityAttachments',
          'opportunityAttachments',
        )
        // .leftJoinAndSelect(
        //   'opportunityAttachments.userAttachment',
        //   'userAttachment',
        // )
        .leftJoin(
          '(' + subquery.getQuery() + ')',
          'jointable',
          'opportunityAttachments.id = jointable.opportunityAttachments_id',
        )
        // .leftJoinAndSelect('user.profileImage', 'profileImage')
        // .leftJoinAndSelect('user.opportunities', 'opportunities')
        // .leftJoinAndSelect('opportunities.opportunityType', 'opportunityType')
        .take(1)
        .skip(0)
        .orderBy('opportunity.createdAt', 'DESC')
        .getRawMany()
    );
  }
  /* FILTER OPPORTUNITIES */
  async getOpportunityCountsByDate(ids): Promise<any[]> {
    return this.opportunityRepository
      .createQueryBuilder(TABLES.OPPORTUNITY)
      .select([
        `ARRAY_TO_STRING(ARRAY_AGG(DISTINCT CAST(${TABLES.OPPORTUNITY}.createdAt AS DATE)), ',') AS date`,
        `count(${TABLES.OPPORTUNITY}.id)::INTEGER`,
        // `ARRAY_AGG(${TABLES.OPPORTUNITY}.id) as ids`,
      ])

      .andWhere(ids ? `${TABLES.OPPORTUNITY}.id IN (:...ids)` : `1=1`, {
        ids: ids,
      })
      .groupBy(`CAST(${TABLES.OPPORTUNITY}.createdAt AS DATE)`)
      .getRawMany();
  }

  /**
   * Get current stage assignees (users) for given assignee settings.
   */
  async getAssigneesFromSettings(
    opportunityId: number,
    assigneeSetting: StageAssigneeSettingsInterface,
  ): Promise<Array<{}>> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
      relations: [
        'opportunityUsers',
        'opportunityUsers.user',
        'opportunityUsers.user.profileImage',
      ],
    });
    let assignees = [];

    if (assigneeSetting && assigneeSetting.allMembers) {
      // Getting all community users.
      const communityData = await this.communityService.getCommunityUsers({
        communityId: opportunity.communityId,
        name: '',
      });
      assignees = assignees.concat(
        _.map(_.head(_.map(communityData, 'communityUsers')), 'user'),
      );
    } else if (assigneeSetting && !assigneeSetting.unassigned) {
      // Find group users
      if (assigneeSetting.groups && assigneeSetting.groups.length) {
        assignees = assignees.concat(
          await this.circleService.getCircleUsers({
            where: {
              id: In(assigneeSetting.groups),
              community: opportunity.communityId,
            },
          }),
        );
      }

      // Find individual users
      if (assigneeSetting.individuals && assigneeSetting.individuals.length) {
        assignees = assignees.concat(
          await this.userService.getUsers({
            where: { id: In(assigneeSetting.individuals) },
            relations: ['profileImage'],
          }),
        );
      }

      // Find users for community roles
      assignees = assignees.concat(
        await this.getCommunityRolesAssignees(assigneeSetting, opportunity),
      );

      // Find users for opportunity roles
      assignees = assignees.concat(
        this.getOpportunityRoleAssignees(assigneeSetting, opportunity),
      );

      // Find custom field assignees
      if (assigneeSetting.customFieldAssignee) {
        assignees = assignees.concat(
          await this.getCustomFieldAssignees(assigneeSetting, opportunity),
        );
      }
    }

    return _.uniqBy(assignees, 'id');
  }

  /**
   * Get stage assignees by custom field for given opportunity.
   * @param assigneeSetting Stage assignee settings.
   * @param opportunity Opportunity to find assignees for.
   */
  private async getCustomFieldAssignees(
    assigneeSetting: StageAssigneeSettingsInterface,
    opportunity: OpportunityEntity,
  ): Promise<UserEntity[]> {
    let assignees = [];
    const fieldData = await this.customFieldDataService.getCustomFieldData({
      where: {
        field: assigneeSetting.customFieldAssignee['fieldId'],
        opportunity: opportunity.id,
      },
      relations: [
        'field',
        'field.customFieldType',
        'field.opportunityFieldData',
      ],
    });

    let fieldUsers = [];
    let fieldGroups = [];
    if (fieldData && fieldData.length && fieldData[0].fieldData) {
      assigneeSetting.customFieldAssignee['options']
        .filter(
          (fieldAssignee: {}) =>
            // Filter selected value for Multi Select type field.
            (fieldData[0].field.customFieldType.abbreviation ===
              CUSTOM_FIELD_TYPE_ABBREVIATIONS.MULTI_SELECT &&
              fieldData[0].fieldData['selected'].includes(
                fieldAssignee['value'],
              )) ||
            // Filter selected value for Single Select type field.
            (fieldData[0].field.customFieldType.abbreviation ===
              CUSTOM_FIELD_TYPE_ABBREVIATIONS.SINGLE_SELECT &&
              fieldData[0].fieldData['selected'] === fieldAssignee['value']) ||
            // Filter selected value for Community User or Group type field.
            (fieldData[0].field.customFieldType.abbreviation ===
              CUSTOM_FIELD_TYPE_ABBREVIATIONS.COMMUNITY_USER_GROUP &&
              fieldData[0].fieldData['selected'].find(
                val =>
                  val['id'] == fieldAssignee['value'] &&
                  val['type'].toLowerCase() ===
                    fieldAssignee['value_type'].toLowerCase(),
              )),
        )
        .map(val => {
          fieldUsers = fieldUsers.concat(val['users'] || []);
          fieldGroups = fieldGroups.concat(val['groups'] || []);
        });
    }

    // Find selected groups' users
    if (fieldGroups && fieldGroups.length) {
      assignees = assignees.concat(
        await this.circleService.getCircleUsers({
          where: {
            id: In(fieldGroups),
            community: opportunity.communityId,
          },
        }),
      );
    }

    // Find selected users
    if (fieldUsers && fieldUsers.length) {
      assignees = assignees.concat(
        await this.userService.getUsers({
          where: { id: In(fieldUsers) },
          relations: ['profileImage'],
        }),
      );
    }

    return assignees;
  }

  /**
   * Get stage assignees by opportunity level roles for given opportunity.
   * @param assigneeSetting Stage assignee settings.
   * @param opportunity Opportunity to find assignees for.
   */
  private getOpportunityRoleAssignees(
    assigneeSetting: StageAssigneeSettingsInterface,
    opportunity: OpportunityEntity,
  ): UserEntity[] {
    let assignees = [];
    const oppUsersAbbr = [];
    if (assigneeSetting.opportunityOwners)
      oppUsersAbbr.push(OpportunityUserType.OWNER);
    if (assigneeSetting.opportunityTeams)
      oppUsersAbbr.push(OpportunityUserType.CONTRIBUTOR);
    if (assigneeSetting.opportunitySubmitters)
      oppUsersAbbr.push(OpportunityUserType.SUBMITTER);

    if (oppUsersAbbr.length) {
      const oppUsers = opportunity.opportunityUsers.filter(opUser =>
        oppUsersAbbr.includes(opUser.opportunityUserType),
      );
      assignees = _.map(oppUsers, 'user') || [];
    }
    return assignees;
  }

  /**
   * Get stage assignees by community level roles for given opportunity.
   * @param assigneeSetting Stage assignee settings.
   * @param opportunity Opportunity to find assignees for.
   */
  private async getCommunityRolesAssignees(
    assigneeSetting: StageAssigneeSettingsInterface,
    opportunity: OpportunityEntity,
  ): Promise<UserEntity[]> {
    let assignees = [];
    const commRolesAbbr = [];
    if (assigneeSetting.communityAdmins)
      commRolesAbbr.push(ROLE_ABBREVIATIONS.ADMIN);
    if (assigneeSetting.communityModerators)
      commRolesAbbr.push(ROLE_ABBREVIATIONS.MODERATOR);
    if (assigneeSetting.communityUsers)
      commRolesAbbr.push(ROLE_ABBREVIATIONS.USER);

    if (commRolesAbbr.length) {
      const roles = await this.roleService.getRoles({
        where: {
          community: opportunity.communityId,
          abbreviation: In(commRolesAbbr),
        },
      });
      const roleActorIds = _.map(
        await this.roleActorService.getRoleActors({
          where: {
            actorType: RoleActorTypes.USER,
            role: In(roles.map(role => role.id)),
            community: opportunity.communityId,
          },
        }),
        'actorId',
      );
      if (roleActorIds && roleActorIds.length) {
        assignees = assignees.concat(
          await this.userService.getUsers({
            where: { id: In(roleActorIds) },
            relations: ['profileImage'],
          }),
        );
      }
    }
    return assignees;
  }

  /**
   * Get current stage assignees (users) for given entity opportunity.
   */

  async getCurrentStageAssignees(
    id: number,
    returnOpportunityId?: boolean,
  ): Promise<{}[]> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id },
      relations: ['stage'],
    });
    const oppoEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    let assignees = [];
    if (opportunity.stage) {
      const assigneeSetting = await this.stageAssigneeService.getOneStageAssigneeSettings(
        {
          entityObjectId: opportunity.id,
          entityType: oppoEntityType,
          community: opportunity.communityId,
          settingsType: StageAssigneeSettingsTypeEnum.ASSIGNEE,
        },
      );

      assignees = await this.getAssigneesFromSettings(id, assigneeSetting);
    }
    if (returnOpportunityId) {
      return [{ opportunityId: id, assignees }];
    }
    return assignees;
  }

  /**
   * Get role actors (users) for all opportunity roles grouped by roles.
   * @param params Opportunity options to get role actors for.
   */
  async getOpportunityRoleActors(params: {
    community: number;
    entityType?: number;
    entityObjectId?: number;
  }): Promise<{}> {
    // Find users for all opportunity roles.
    const roles = await this.roleService.getRoles({
      where: {
        community: params.community,
        abbreviation: In([
          ROLE_ABBREVIATIONS.OPPORTUNITY_OWNER,
          ROLE_ABBREVIATIONS.OPPORTUNITY_CONTRIBUTOR,
          ROLE_ABBREVIATIONS.OPPORTUNITY_SUBMITTER,
        ]),
      },
    });
    const roleActors = await this.roleActorsService.getRoleActors({
      where: {
        actorType: RoleActorTypes.USER,
        role: In(roles.map(role => role.id)),
        ...(params.entityType && { entityType: params.entityType }),
        ...(params.entityObjectId && { entityObjectId: params.entityObjectId }),
      },
    });

    const roleActorsGroupedByIds = _.groupBy(roleActors, 'roleId');
    const roleActorsGrouped = {};
    _.map(roleActorsGroupedByIds, (val, key) => {
      roleActorsGrouped[
        roles.find(r => r.id == parseInt(key)).abbreviation
      ] = _.uniqBy(val, 'actorId');
    });

    return roleActorsGrouped;
  }

  /**
   * Get opportunities
   */
  async getOneOpportunity(options: {}): Promise<OpportunityEntity> {
    return this.opportunityRepository.findOne(options);
  }
  /**
   * Get opportunities
   */
  async getOpportunities(options: {}): Promise<OpportunityEntity[]> {
    return this.opportunityRepository.find(options);
  }
  /**
   * Get opportunities
   */
  async getOpportunitiesCount(options: {}): Promise<{}> {
    return this.opportunityRepository.findAndCount(options);
  }
  /**
   * Get opportunities
   */
  async getOpportunityCount(options: {}): Promise<number> {
    return this.opportunityRepository.count(options);
  }
  /**
   * Get opportunities
   */
  async getOpportunitiesWithCount(options: {}): Promise<
    [OpportunityEntity[], number]
  > {
    return this.opportunityRepository.findAndCount(options);
  }

  async getSimpleOpportunities(options: {}): Promise<OpportunityEntity[]> {
    return this.opportunityRepository.find(options);
  }

  /**
   * Search opportunities
   */
  async searchOpportunitiesWithCount(options: {
    mainTableWhereFilters: {};
    take: number;
    skip: number;
    orderBy?: {};
    statuses?: [];
    tags?: [];
  }): Promise<[OpportunityEntity[], number]> {
    const searchText = options.mainTableWhereFilters['search'];
    delete options.mainTableWhereFilters['search'];

    const query = this.opportunityRepository
      .createQueryBuilder('opportunity')
      .leftJoinAndSelect('opportunity.community', 'community')
      .leftJoinAndSelect('opportunity.user', 'user')
      .leftJoinAndSelect('opportunity.opportunityType', 'opportunityType')
      .leftJoinAndSelect(
        'opportunity.opportunityAttachments',
        'opportunityAttachments',
      )
      .leftJoinAndSelect('opportunity.challenge', 'challenge')
      .leftJoinAndSelect('opportunity.opportunityUsers', 'opportunityUsers')
      .leftJoinAndSelect('opportunity.stage', 'stage')
      .leftJoinAndSelect('opportunity.workflow', 'workflow')

      .leftJoinAndSelect('opportunityUsers.user', 'opportunityUser')
      .leftJoinAndSelect(
        'opportunityUser.profileImage',
        'opportunityUserProfileImage',
      )
      .leftJoinAndSelect('user.profileImage', 'profileImage')
      .leftJoinAndSelect(
        'opportunityAttachments.userAttachment',
        'userAttachment',
      )
      .leftJoinAndSelect('stage.actionItem', 'actionItem')
      .leftJoinAndSelect('stage.status', 'status')
      .where(options.mainTableWhereFilters)
      .andWhere(
        options.statuses && options.statuses.length
          ? `status.id IN (:...status)`
          : '1=1',
        {
          status: options.statuses,
        },
      );
    if (options.tags && options.tags.length) {
      query.andWhere(':tags && opportunity.tags', {
        tags: options.tags,
      });
    }

    if (searchText) {
      query.andWhere(
        new Brackets(qb => {
          qb.where('opportunity.title ILIKE :title', {
            title: `%${searchText}%`,
          }).orWhere('opportunity.description ILIKE :description', {
            description: `%${searchText}%`,
          });
        }),
      );
    }

    const result = query
      .take(options.take)
      .skip(options.skip)
      .orderBy(options.orderBy)
      .getManyAndCount();
    return result;
  }
  /**
   * Search opportunities
   */
  async searchOpportunitiesWithCountOptimize(options: {
    mainTableWhereFilters: {};
    orderBy?: {};
    statuses?: [];
    tags?: [];
  }): Promise<OpportunityEntity[]> {
    const searchText = options.mainTableWhereFilters['search'];
    delete options.mainTableWhereFilters['search'];

    const query = this.opportunityRepository
      .createQueryBuilder('opportunity')
      .leftJoinAndSelect(
        'opportunity.opportunityAttachments',
        'opportunityAttachments',
      )
      .leftJoinAndSelect('opportunity.stage', 'stage')
      .leftJoinAndSelect('stage.status', 'status')
      .where(options.mainTableWhereFilters)
      .andWhere(
        options.statuses && options.statuses.length
          ? `status.id IN (:...status)`
          : '1=1',
        {
          status: options.statuses,
        },
      );
    if (options.tags && options.tags.length) {
      query.andWhere(':tags && opportunity.tags', {
        tags: options.tags,
      });
    }
    if (searchText) {
      query.andWhere(
        new Brackets(qb => {
          qb.where('opportunity.title ILIKE :title', {
            title: `%${searchText}%`,
          }).orWhere('opportunity.description ILIKE :description', {
            description: `%${searchText}%`,
          });
        }),
      );
    }

    const result = query.orderBy(options.orderBy).getMany();
    return result;
  }
  /**
   * Search opportunities
   */
  async searchOpportunitiesDetailsOptimize(options: {
    community?: boolean;
    user?: boolean;
    opportunityType?: boolean;
    opportunityAttachments?: boolean;
    challenge?: boolean;
    opportunityUsers?: boolean;
    stage?: boolean;
    workflow?: boolean;
    actionItem?: boolean;
    status?: boolean;
    whereClause: {};
  }): Promise<OpportunityEntity[]> {
    const query = this.opportunityRepository.createQueryBuilder('opportunity');
    if (options.community) {
      query.leftJoinAndSelect('opportunity.community', 'community');
    }
    if (options.user) {
      query
        .leftJoinAndSelect('opportunity.user', 'user')
        .leftJoinAndSelect('user.profileImage', 'profileImage');
    }
    if (options.opportunityType) {
      query.leftJoinAndSelect('opportunity.opportunityType', 'opportunityType');
    }
    if (options.opportunityAttachments) {
      query.leftJoinAndSelect(
        'opportunity.opportunityAttachments',
        'opportunityAttachments',
      );
    }
    if (options.challenge) {
      query.leftJoinAndSelect('opportunity.challenge', 'challenge');
    }
    if (options.opportunityUsers) {
      query
        .leftJoinAndSelect('opportunity.opportunityUsers', 'opportunityUsers')
        .leftJoinAndSelect('opportunityUsers.user', 'opportunityUser')
        .leftJoinAndSelect(
          'opportunityUser.profileImage',
          'opportunityUserProfileImage',
        );
    }
    if (options.stage) {
      query
        .leftJoinAndSelect('opportunity.stage', 'stage')
        .leftJoinAndSelect('stage.actionItem', 'actionItem')
        .leftJoinAndSelect('stage.status', 'status');
    }
    if (options.workflow) {
      query.leftJoinAndSelect('opportunity.workflow', 'workflow');
    }
    if (options.opportunityAttachments) {
      query.leftJoinAndSelect(
        'opportunityAttachments.userAttachment',
        'userAttachment',
      );
    }

    query.where(options.whereClause);

    const result = query.getMany();
    return result;
  }

  /**
   * Add opportunity
   */
  async addOpportunity(data: {}, actorData): Promise<OpportunityEntity> {
    const entityExperienceSetting = data['entityExperienceSetting'] || {};
    const opportunityTypeFieldsData = _.cloneDeep(
      data['opportunityTypeFieldsData'],
    );
    delete data['opportunityTypeFieldsData'];
    delete data['entityExperienceSetting'];
    const mentions = data['mentions'] || [];
    data['mentions'] = [];

    const opportunityCreated = this.opportunityRepository.create(data);

    const opportunityAddedData = await this.opportunityRepository.save(
      opportunityCreated,
    );
    const savedOpportunity = await this.getOneOpportunity({
      where: { id: opportunityAddedData.id },
      relations: ['community'],
    });
    this.elasticSearchService.addOpportunityData(savedOpportunity);
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    // add mentions
    let addedMentions = [];
    if (mentions && mentions.length) {
      mentions.map(async mention => {
        mention['entityObjectId'] = opportunityAddedData.id;
        mention['entityType'] = oppEntityType.id;
        mention['community'] = data['community'];
      });
      addedMentions = await this.mentionService.bulkAddMentions(mentions);

      const addedMentionsIds = addedMentions.map(mention => mention.id);
      await this.opportunityRepository.update(
        { id: opportunityAddedData.id },
        { mentions: addedMentionsIds },
      );
      opportunityAddedData.mentions = addedMentionsIds;
    }

    // add opportunity submitter
    await this.opportunityUserService.addOpportunityUserWithSetting(
      [
        {
          user: actorData.id,
          opportunity: opportunityAddedData.id,
          community: opportunityAddedData.community,
          message: 'Original Submitter',
          opportunityUserType: OpportunityUserType.SUBMITTER,
        },
      ],
      actorData,
      false,
    );

    const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );

    // save opportunity experience/collaboration settings
    if (opportunityAddedData.challenge) {
      const challengeExpSettings = await this.entityExperienceSettingService.getEntityExperienceSetting(
        {
          where: {
            entityObjectId: opportunityAddedData.challenge,
            entityType: challengeEntityType.id,
            community: opportunityAddedData.community,
          },
        },
      );

      await this.entityExperienceSettingService.addEntityExperienceSetting({
        ...challengeExpSettings,
        id: undefined,
        entityType: oppEntityType,
        entityObjectId: opportunityAddedData.id,
        community: opportunityAddedData.community,
      });
    } else {
      await this.entityExperienceSettingService.addEntityExperienceSetting({
        ...entityExperienceSetting,
        entityType: oppEntityType,
        entityObjectId: opportunityAddedData.id,
        community: opportunityAddedData.community,
      });
    }

    // save opportunity visibility settings
    this.addOpportunityVisbilitySettings(
      opportunityAddedData,
      data['challenge'],
    );

    // assign points
    const points = await CommunityActionPoints.addUserPoints({
      actionType: ACTION_TYPES.POST,
      entityTypeName: ENTITY_TYPES.IDEA,
      community: data['community'],
      userId: actorData.id,
      entityObjectId: opportunityCreated.id,
    });

    // Saving opportunity's custom fields data.
    if (opportunityTypeFieldsData && opportunityTypeFieldsData.length) {
      _.map(
        opportunityTypeFieldsData,
        (val: {
          field: number;
          fieldData: object;
          opportunity: number;
          community: number | CommunityEntity;
        }) => {
          val.opportunity = opportunityAddedData.id;
          val.community = opportunityAddedData.community;
        },
      );
      await this.customFieldDataService.addCustomFieldData(
        opportunityTypeFieldsData,
      );
    }

    // Save linked opportunity fields.
    const oppTypeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.OPPORTUNITY_TYPE,
    );

    const oppTypeFields = await this.customFieldIntegrationService.getCustomFieldIntegrations(
      {
        entityType: oppTypeEntityType,
        entityObjectId: opportunityAddedData.opportunityType,
        community: opportunityAddedData.community,
      },
    );

    if (oppTypeFields && oppTypeFields.length) {
      const linkedFields = oppTypeFields.map(typeField => ({
        opportunity: opportunityAddedData.id,
        field: typeField.fieldId,
        community: opportunityAddedData.community,
        fieldIntegrationType: [
          FieldIntegrationTypeEnum.OPP_TYPE_SUBMISSION_FORM,
        ],
      }));

      this.opportunityFieldLinkageService.bulkAddOpportunityFieldLinkage(
        linkedFields,
      );
    }

    // Generate activity log and notifications
    actorData['community'] = data['community'];
    const userEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.USER,
    );
    NotificationHookService.notificationHook({
      actionData: {
        ...opportunityAddedData,
        entityObjectId: opportunityAddedData.id,
        entityType: oppEntityType.id,
      },
      actorData: actorData,
      actionType: ACTION_TYPES.POST,
      isActivity: true,
      isNotification: false,
    });

    // Generating notifications for poster's followers.
    const userFollowers = await this.followingContentService.getFollowByEntityByEntityObjectId(
      [actorData.id],
      userEntityType.id,
    );
    if (userFollowers && _.head(userFollowers)) {
      const followers = _.head(userFollowers)['userFollowingContents'].map(
        follower => follower['user'],
      );
      followers.map((follower: UserEntity) =>
        NotificationHookService.notificationHook({
          actionData: {
            ...opportunityAddedData,
            entityObjectId: opportunityAddedData.id,
            entityType: oppEntityType.id,
            user: follower,
          },
          actorData: actorData,
          actionType: ACTION_TYPES.POST,
          isActivity: false,
          isNotification: true,
          invertUser: true,
        }),
      );
    }

    // Generate notifcations for mentions.
    if (addedMentions && addedMentions.length) {
      this.mentionService.generateNotifications({
        actionData: {
          ...opportunityAddedData,
          entityObjectId: opportunityAddedData.id,
          entityType: oppEntityType.id,
        },
        actorData: actorData,
        mentions: addedMentions,
        mentionType: MENTION_TYPES.OPPORTUNITY_DESCRIPTION,
        mentionEntity: opportunityAddedData,
      });
    }

    opportunityAddedData['points'] = {
      value: points,
      type: ACTION_TYPES.POST,
    };
    return opportunityAddedData;
  }

  /**
   * Add opportunity's visibility settings.
   * @param opportunity Opportunity to add visibility settings for.
   * @param challenge Challenge from which visbility settings need to be inherited.
   */
  private async addOpportunityVisbilitySettings(
    opportunity: OpportunityEntity,
    challenge?: number,
  ): Promise<{}> {
    const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    let addedVisSetting;
    if (challenge) {
      const challengeVisSetting = await this.entityVisibilitySettingService.getEntityVisibilitySetting(
        {
          where: {
            entityObjectId: challenge,
            entityType: challengeEntityType.id,
            community: opportunity.community,
          },
        },
      );

      addedVisSetting = await this.entityVisibilitySettingService.addEntityVisibilitySetting(
        {
          ...challengeVisSetting,
          id: undefined,
          entityType: oppEntityType,
          entityObjectId: opportunity.id,
          community: opportunity.community,
        },
      );
    } else {
      addedVisSetting = await this.entityVisibilitySettingService.addEntityVisibilitySetting(
        {
          entityType: oppEntityType,
          entityObjectId: opportunity.id,
          community: opportunity.community,
          ...{ public: true },
        },
      );
    }
    return addedVisSetting;
  }

  /**
   * Update opportunity
   */
  async updateOpportunityBulk(options: {}, data: {}): Promise<{}> {
    return this.opportunityRepository.update(options, data);
  }

  async updateOpportunity(
    options: { id: number },
    data: {},
    actorData,
    originUrl?,
  ): Promise<{}> {
    const stopNotifications = data['stopNotifications']
      ? data['stopNotifications']
      : false;
    const entityExperienceSetting = data['entityExperienceSetting'];
    const entityVisibilitySetting = data['entityVisibilitySetting']
      ? data['entityVisibilitySetting']
      : '';
    const opportunityTypeFieldsData = _.cloneDeep(
      data['opportunityTypeFieldsData'],
    );
    const stageAssignmentSettings = _.cloneDeep(
      data['stageAssignmentSettings'],
    );
    delete data['stageAssignmentSettings'];
    delete data['opportunityTypeFieldsData'];
    delete data['entityExperienceSetting'];
    delete data['entityVisibilitySetting'];
    delete data['stopNotifications'];
    const mentions = data['mentions'] || [];

    const existingOpportunity = await this.opportunityRepository.findOne({
      relations: ['community'],
      where: { id: options.id },
    });
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    const existingMentions =
      existingOpportunity.mentions && existingOpportunity.mentions.length
        ? await this.mentionService.getMentions({
            where: { id: In(existingOpportunity.mentions) },
          })
        : [];

    let addedMentions = [];
    if (data['mentions']) {
      // remove existing mentions
      if (existingOpportunity.mentions && existingOpportunity.mentions.length) {
        await this.mentionService.removeMention(
          existingOpportunity.mentions.map(mention => ({ id: mention })),
        );
      }

      // add new mentions
      mentions.map(async mention => {
        mention['entityObjectId'] = existingOpportunity.id;
        mention['entityType'] = entityType.id;
        mention['community'] = existingOpportunity.communityId;
        delete mention['id'];
        delete mention['createdAt'];
        delete mention['updatedAt'];
      });
      addedMentions = await this.mentionService.bulkAddMentions(
        _.compact(mentions),
      );
      data['mentions'] = addedMentions.map(
        mention => mention && mention.id && mention.id,
      );
    }

    // Updating existing custom fields data.
    if (opportunityTypeFieldsData && opportunityTypeFieldsData.length) {
      await this.customFieldDataService.addOrUpdateCustomFieldData(
        {
          opportunity: existingOpportunity.id,
          community: existingOpportunity.communityId,
        },
        opportunityTypeFieldsData,
      );
      // getStageCompletionStats
      const completionData = await this.getStageCompletionStats(
        existingOpportunity,
      );
      const percentage =
        (parseInt(completionData.total.toString()) /
          parseInt(completionData.completed.toString())) *
        100;
      const ideaEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
        ENTITY_TYPES.IDEA,
      );
      if (percentage) {
        NotificationHookService.updateStageEmailSetting({
          updateCondition: {
            community: existingOpportunity.communityId,
            stageId: existingOpportunity.stageId,
            entityObjectId: existingOpportunity.id,
            entityType: ideaEntityType.id,
          },
          dataToUpdate: { isCompleted: 1 },
        });
      }
    }

    // Save linked opportunity fields.
    if (data['opportunityType']) {
      const oppTypeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
        ENTITY_TYPES.OPPORTUNITY_TYPE,
      );

      const oppTypeFields = await this.customFieldIntegrationService.getCustomFieldIntegrations(
        {
          entityType: oppTypeEntityType,
          entityObjectId: data['opportunityType'],
          community: existingOpportunity.communityId,
        },
      );

      if (oppTypeFields && oppTypeFields.length) {
        const linkedFields = oppTypeFields.map(typeField => ({
          field: typeField.fieldId,
        }));

        this.opportunityFieldLinkageService.bulkAddOrUpdateOpportunityFieldLinkage(
          {
            opportunity: existingOpportunity.id,
            community: existingOpportunity.communityId,
            fieldIntegrationType:
              FieldIntegrationTypeEnum.OPP_TYPE_SUBMISSION_FORM,
          },
          linkedFields,
        );
      }
    }

    // Link stage custom fields with opportunity.
    const stageEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.STAGE,
    );
    // Link stage custom fields with opportunity.
    const ideaEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    if (data['stage']) {
      const stageFields = await this.customFieldIntegrationService.getCustomFieldIntegrations(
        {
          entityType: stageEntityType,
          entityObjectId: data['stage'],
          community: existingOpportunity.communityId,
        },
      );

      if (stageFields && stageFields.length) {
        const integratedFields = stageFields.map(typeField => ({
          field: typeField.fieldId,
        }));

        this.opportunityFieldLinkageService.bulkAddOrUpdateOpportunityFieldLinkage(
          {
            opportunity: existingOpportunity.id,
            community: existingOpportunity.communityId,
            fieldIntegrationType: FieldIntegrationTypeEnum.STAGE,
          },
          integratedFields,
        );
      }
    }

    const resultUpdate = await this.opportunityRepository.update(options, data);
    const opportunityData = await this.opportunityRepository.findOne({
      relations: [
        'community',
        'opportunityUsers',
        'opportunityUsers.user',
        'stage',
        'stage.actionItem',
        'opportunityAttachments',
      ],
      where: { id: options.id },
    });

    this.elasticSearchService.editOpportunityData({
      id: opportunityData.id,
      oppNumber: opportunityData.id,
      title: opportunityData.title,
      description: opportunityData.description,
      communityId: opportunityData.communityId,
      isDeleted: opportunityData.isDeleted,
    });
    let points;
    let reason;

    if (
      data['stage'] &&
      opportunityData.stage.actionItem.abbreviation !==
        ACTION_ITEM_ABBREVIATIONS.NO_TOOL
    ) {
      const currentAssignees = await this.getCurrentStageAssignees(options.id);
      NotificationHookService.addStageEmailHook({
        emailType: 'notification',
        entityType: ideaEntityType.id,
        entityObjectId: options.id,
        users: currentAssignees,
        stageId: data['stage'],
        reminderFrequency:
          REMINDER_FREQUENCY_MAPPING[
            _.toUpper(stageAssignmentSettings.emailReminder)
          ],
        actionType: '',
        community: existingOpportunity.communityId,
      });
    }

    if (entityVisibilitySetting) {
      const dataToUpdate = { roles: [], groups: [], public: false };
      if (entityVisibilitySetting.public) {
        dataToUpdate.public = true;
      } else if (entityVisibilitySetting.private) {
        const ownerRole = await this.roleService.getRoles({
          where: {
            title: In([
              RolesEnum.admin,
              RolesEnum.moderator,
              RolesEnum.opportunityOwner,
              RolesEnum.opportunityContributor,
              RolesEnum.opportunitySubmitter,
            ]),
            community: opportunityData.community.id,
          },
        });
        const roleIds = _.map(ownerRole, 'id');
        dataToUpdate.roles = roleIds;
      } else if (
        entityVisibilitySetting.groups &&
        entityVisibilitySetting.groups.length
      ) {
        dataToUpdate.groups = entityVisibilitySetting.groups;
      } else {
        // If nothing selected, defaults to public.
        dataToUpdate.public = true;
      }
      await this.entityVisibilitySettingService.updateEntityVisibilitySetting(
        {
          entityType: entityType.id,
          entityObjectId: opportunityData.id,
          community: opportunityData.community.id,
        },
        dataToUpdate,
      );
    }
    if (resultUpdate.affected > 0) {
      // Sending Action Item notifications
      if (data['stage'] && existingOpportunity.stageId !== data['stage']) {
        this.sendActionItemNotificationOnStageChange({
          opportunity: opportunityData,
          stageAssignmentSettings,
          entityType,
          originUrl: originUrl,
        });
      }

      if (entityExperienceSetting) {
        // save opportunity experience/collaboration settings
        await this.entityExperienceSettingService.updateEntityExperienceSetting(
          {
            entityType: entityType,
            entityObjectId: opportunityData.id,
            community: opportunityData.communityId,
          },
          entityExperienceSetting,
        );
      }

      // Generate activity log and notifications
      actorData['community'] = opportunityData.community.id;
      if (!data['viewCount'] && !stopNotifications) {
        NotificationHookService.notificationHook({
          actionData: {
            ...opportunityData,
            entityObjectId: opportunityData.id,
            entityType: entityType.id,
          },
          actorData: actorData,
          actionType: ACTION_TYPES.EDIT,
          isActivity: true,
          isNotification: false,
        });

        // Generate notifications for Opportunity Stakeholders.
        const opportunityUsers = opportunityData.opportunityUsers.map(
          oppUser => oppUser.user,
        );
        opportunityUsers.map((oppUser: UserEntity) =>
          NotificationHookService.notificationHook({
            actionData: {
              ...opportunityData,
              entityObjectId: opportunityData.id,
              entityType: entityType.id,
              user: oppUser,
            },
            actorData: actorData,
            actionType: ACTION_TYPES.EDIT,
            isActivity: false,
            isNotification: true,
            invertUser: true,
          }),
        );

        // Generate new mentions notifications.
        if (addedMentions && addedMentions.length) {
          const newMentions = this.mentionService.diffMentions(
            addedMentions,
            existingMentions,
          );
          if (newMentions && newMentions.length) {
            this.mentionService.generateNotifications({
              actionData: {
                ...opportunityData,
                entityObjectId: opportunityData.id,
                entityType: entityType.id,
              },
              actorData: actorData,
              mentions: newMentions,
              mentionType: MENTION_TYPES.OPPORTUNITY_DESCRIPTION,
              mentionEntity: opportunityData,
            });
          }
        }
      } else {
        points = await CommunityActionPoints.addUserPoints({
          actionType: ACTION_TYPES.VIEW,
          entityTypeName: ENTITY_TYPES.IDEA,
          community: opportunityData.community.id,
          userId: actorData.id,
          entityObjectId: opportunityData.id,
        });
        NotificationHookService.notificationHook({
          actionData: {
            ...opportunityData,
            entityObjectId: opportunityData.id,
            entityType: entityType.id,
            user: actorData,
          },
          actorData: actorData,
          actionType: ACTION_TYPES.VIEW,
          isActivity: false,
          isNotification: false,
          isEmail: false,
          invertUser: true,
        });
        reason = ACTION_TYPES.VIEW;
      }
    }
    resultUpdate['points'] = {
      value: points,
      type: reason,
    };
    return resultUpdate;
  }

  async generateUpdateStageNotification(params: {
    opportunity: OpportunityEntity;
    stageNotificationSettings: StageNotificationSettingsInterface;
    actionData: {};
    actorData: {};
    actionType: string;
    newStage: StageEntity;
    newWorkflow?: WorkflowEntity;
    oldStage?: StageEntity;
    oldWorkflow?: WorkflowEntity;
    autogenerated?: boolean;
  }): Promise<void> {
    const notifiableUsers = await this.getNotifiableUsersFromSettings(
      params.opportunity.id,
      params.stageNotificationSettings,
    );

    const entityOperendObject = {
      ...(params.oldStage && {
        previousStage: {
          id: params.oldStage.id,
          title: params.oldStage.title,
          description: params.oldStage.description,
        },
      }),
      currentStage: {
        id: params.newStage.id,
        title: params.newStage.title,
        description: params.newStage.description,
      },
      ...(params.oldWorkflow && {
        previousWorkflow: {
          id: params.oldWorkflow.id,
          title: params.oldWorkflow.title,
          description: params.oldWorkflow.description,
        },
      }),
      ...(params.newWorkflow && {
        currentWorkflow: {
          id: params.newWorkflow.id,
          title: params.newWorkflow.title,
          description: params.newWorkflow.description,
        },
      }),

      ...(params.stageNotificationSettings.message && {
        message: params.stageNotificationSettings.message,
      }),
      ...(params.autogenerated && { autogenerated: params.autogenerated }),
    };

    NotificationHookService.notificationHook({
      actionData: { ...params.actionData, user: params.actorData },
      actorData: params.actorData,
      actionType: params.actionType,
      invertUser: true,
      entityOperendObject,
      isActivity: true,
      isNotification: false,
      isEmail: false,
    });

    notifiableUsers.forEach((user: UserEntity) => {
      NotificationHookService.notificationHook({
        actionData: { ...params.actionData, user },
        actorData: params.actorData,
        actionType: params.actionType,
        invertUser: true,
        entityOperendObject,
        isActivity: false,
        isNotification: true,
        isEmail: params.stageNotificationSettings.sendEmail || false,
        enableSameUserEmail: true,
      });
    });
  }

  async sendActionItemNotificationOnStageChange(params: {
    opportunity: OpportunityEntity;
    stageAssignmentSettings: AddStageAssignmentSettingsDto;
    entityType: EntityTypeEntity;
    originUrl: string;
  }): Promise<void> {
    const assignees = await this.getCurrentStageAssignees(
      params.opportunity.id,
    );

    _.map(assignees, (assignee: UserEntity) =>
      NotificationHookService.actionItemLogHook({
        entityTypeId: params.entityType.id,
        entityObjectId: params.opportunity.id,
        userId: assignee.id,
        userName: assignee.userName,
        userEmail: assignee.email,
        actionItemId: params.opportunity.stage.actionItem.id,
        actionItemTitle: params.opportunity.stage.actionItem.title,
        actionItemAbbreviation:
          params.opportunity.stage.actionItem.abbreviation,
        ...((params.stageAssignmentSettings.stageTimeLimit ||
          params.stageAssignmentSettings.stageTimeLimit === 0) && {
          actionDueDate: moment(params.opportunity.stageAttachmentDate)
            .add(params.stageAssignmentSettings.stageTimeLimit, 'days')
            .endOf('day')
            .toDate(),
        }),
        entityTitle: params.opportunity.title,
        entityDescription: params.opportunity.description,
        ...(params.opportunity.opportunityAttachments &&
          params.opportunity.opportunityAttachments.length && {
            entityImageUrl: params.opportunity.opportunityAttachments[0].url,
          }),
        community: params.opportunity.communityId,
        communityName: params.opportunity.community.name,
        isEmail: false,
        isLog: true,
        isNotification: true,
        originUrl: params.originUrl,
      }),
    );
  }

  /**
   * Delete opportunity
   */
  async deleteOpportunity(options: {}): Promise<{}> {
    return this.opportunityRepository.delete(options);
  }

  /**
   * Search opportunity
   */
  async getOpportunitiesCountOnOpportunity(
    community,
    type,
    tagId,
  ): Promise<{}> {
    const res = await this.opportunityRepository
      .createQueryBuilder('opportunity')
      .select('opportunity.id')
      .where('opportunity.community = :community', {
        community: community,
      })
      .andWhere('opportunity.opportunityType = :type', {
        type: type,
      })
      .andWhere(':tags = ANY (opportunity.tags)', {
        tags: tagId,
      })
      .getCount();
    return { tagId: tagId, count: res };
  }

  /**
   * Delete opportunity
   */
  async getSimilarOpportunities(
    searchKeys: { title: string },
    community,
  ): Promise<{}> {
    return this.opportunityRepository
      .createQueryBuilder('opportunity')
      .where('opportunity.community = :community', {
        community: community,
      })
      .andWhere('opportunity.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere(
        new Brackets(qb => {
          if (searchKeys.title) {
            qb.orWhere('LOWER(opportunity.title) like :title', {
              title: `%${searchKeys.title.toLowerCase()}%`,
            });
          }
          if (!searchKeys.title) {
            qb.orWhere('1 = :trueCase', {
              trueCase: 1,
            });
          }
        }),
      )
      .getManyAndCount();
  }

  async getOpportunityCountByType(opportunityIds): Promise<{}> {
    return this.opportunityRepository
      .createQueryBuilder(TABLES.OPPORTUNITY)
      .select([
        `array_agg(${TABLES.OPPORTUNITY}.id) as ids`,
        `count(${TABLES.OPPORTUNITY}.id)`,
        `opportunityType.name as opportunityType`,
        `ARRAY_TO_STRING(ARRAY_AGG(DISTINCT opportunityType.id), ',') AS opportunityTypeId`,
      ])
      .leftJoin(`${TABLES.OPPORTUNITY}.opportunityType`, 'opportunityType')
      .andWhere(
        opportunityIds
          ? `${TABLES.OPPORTUNITY}.id IN (:...opportunityIds)`
          : `1=1`,
        {
          opportunityIds: opportunityIds,
        },
      )
      .addGroupBy(`opportunityType`)
      .getRawMany();
  }
  async addOpportunityStageData(body, id, community): Promise<void> {
    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    await this.stageAssigneeService.deletestageAssignee({
      entityType: opportunityEntityType.id,
      entityObjectId: id,
    });
    await this.stageAssignmentSettingService.deleteStageAssignmentSetting({
      entityType: opportunityEntityType.id,
      entityObjectId: id,
    });
    await this.stageNotificationSettingService.deleteStageNotificationSetting({
      entityType: opportunityEntityType.id,
      entityObjectId: id,
    });
    if (body.assigneeSettings) {
      body.assigneeSettings = {
        ...body.assigneeSettings,
        id: undefined,
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          settingsType: 'assignee',
          community: community,
        },
      };
      await this.stageAssigneeService.addstageAssignee(body.assigneeSettings);
    }
    if (body.stageActivityVisibilitySettings) {
      body.stageActivityVisibilitySettings = {
        ...body.stageActivityVisibilitySettings,
        id: undefined,
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          settingsType: 'visibility',
          community: community,
        },
      };
      await this.stageAssigneeService.addstageAssignee(
        body.stageActivityVisibilitySettings,
      );
    }
    if (body.stageAssignmentSettings) {
      body.stageAssignmentSettings = {
        ...body.stageAssignmentSettings,
        id: undefined,
        ...(body.stageAssignmentSettings['stageTimeLimit'] && {
          stageTimeLimit: Math.abs(
            body.stageAssignmentSettings['stageTimeLimit'],
          ),
        }),
        ...(body.stageAssignmentSettings['completionTimeLimit'] && {
          completionTimeLimit: Math.abs(
            body.stageAssignmentSettings['completionTimeLimit'],
          ),
        }),
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
        },
      };
      await this.stageAssignmentSettingService.addStageAssignmentSetting(
        body.stageAssignmentSettings,
      );
    }
    if (body.stageNotificationSettings) {
      body.stageNotificationSettings = {
        ...body.stageNotificationSettings,
        id: undefined,
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
        },
      };
      await this.stageNotificationSettingService.addStageNotificationSetting(
        body.stageNotificationSettings,
      );
    }
  }
  async editOpportunityStageData(body, id, community): Promise<void> {
    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    if (body.assigneeSettings) {
      body.assigneeSettings = {
        ...body.assigneeSettings,
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          settingsType: 'assignee',
          community: community,
        },
      };
      await this.stageAssigneeService.updatestageAssignee(
        {
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
          settingsType: 'assignee',
        },
        body.assigneeSettings,
      );
    }
    if (body.stageActivityVisibilitySettings) {
      body.stageActivityVisibilitySettings = {
        ...body.stageActivityVisibilitySettings,
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          settingsType: 'visibility',
          community: community,
        },
      };
      await this.stageAssigneeService.updatestageAssignee(
        {
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
          settingsType: 'visibility',
        },
        body.stageActivityVisibilitySettings,
      );
    }
    if (body.stageAssignmentSettings) {
      body.stageAssignmentSettings = {
        ...body.stageAssignmentSettings,
        ...(body.stageAssignmentSettings['stageTimeLimit'] && {
          stageTimeLimit: Math.abs(
            body.stageAssignmentSettings['stageTimeLimit'],
          ),
        }),
        ...(body.stageAssignmentSettings['completionTimeLimit'] && {
          completionTimeLimit: Math.abs(
            body.stageAssignmentSettings['completionTimeLimit'],
          ),
        }),
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
        },
      };
      await this.stageAssignmentSettingService.updateStageAssignmentSetting(
        {
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
        },
        body.stageAssignmentSettings,
      );
    }
    if (body.stageNotificationSettings) {
      body.stageNotificationSettings = {
        ...body.stageNotificationSettings,
        ...{
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
        },
      };
      await this.stageNotificationSettingService.updateStageNotificationSetting(
        {
          entityType: opportunityEntityType.id,
          entityObjectId: id,
          community: community,
        },
        body.stageNotificationSettings,
      );
    }
  }

  checkAssigneeAllMembersUnassingedRequest(
    settings: AddStageAssigneeSettingsDto,
  ): AddStageAssigneeSettingsDto {
    let settingsModified = _.cloneDeep(settings);
    if (
      settings.communityAdmins &&
      settings.communityModerators &&
      settings.communityUsers
    ) {
      settingsModified = {
        ...settings,
        allMembers: true,
        unassigned: false,
        communityAdmins: false,
        communityModerators: false,
        communityUsers: false,
      };
    } else if (
      !settings.communityAdmins &&
      !settings.communityModerators &&
      !settings.communityUsers &&
      !settings.opportunityOwners &&
      !settings.opportunitySubmitters &&
      !settings.opportunityTeams &&
      !settings.customFieldAssignee &&
      !settings.groups.length &&
      !settings.individuals.length
    ) {
      settingsModified = {
        ...settings,
        unassigned: true,
        allMembers: false,
      };
    } else {
      settingsModified = {
        ...settings,
        unassigned: false,
        allMembers: false,
      };
    }
    return settingsModified;
  }

  /**
   * Get Opportunity Status / Get Opportunity Status By Filters
   * @param {Object} params To Filter Data.
   * @return List of Statuses With Counts Against Opportunities
   */
  async getOpportunityStatus(params): Promise<[] | {}> {
    const query = this.opportunityRepository
      .createQueryBuilder('opportunity')
      .select([
        'status.title',
        'status.id',
        'status.colorCode',
        'count(status.id) as total',
      ])
      .where('opportunity.community = :community', {
        community: params.community,
      });

    //Get Challenge Specific Opportunities Statuses
    if (params.challenge) {
      query.andWhere(`opportunity.challenge = :challenge`, {
        challenge: params.challenge,
      });
    }

    // Get User Specific Opportunities Statuses
    if (params.user) {
      const oppUserSubquery = getRepository(OpportunityUserEntity)
        .createQueryBuilder('opportunityUser')
        .select('DISTINCT opportunityUser.opportunity')
        .where(`opportunityUser.user = ${params.user}`);

      query.andWhere(`opportunity.id IN (${oppUserSubquery.getQuery()})`);
    }

    query
      .innerJoin('opportunity.stage', 'stage')
      .innerJoin('stage.status', 'status')
      .groupBy('status.id');

    return camelcaseKeys(await query.getRawMany());
  }
  async getStageCompletionStats(opportunity: OpportunityEntity) {
    // Link stage custom fields with opportunity.
    const stageEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.STAGE,
    );
    // Link stage custom fields with opportunity.
    const opportunityEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    const dataForCustomFieldIntegrations = await this.customFieldIntegrationService.getCustomFieldIntegrations(
      {
        entityObjectId: opportunity.stageId,
        entityType: stageEntityType,
        community: opportunity.communityId,
      },
    );
    const fieldIds = _.map(dataForCustomFieldIntegrations, 'fieldId');
    const whereClause = {
      opportunity: opportunity.id,
    };
    if (fieldIds.length) {
      whereClause['field'] = fieldIds;
    }
    const customFieldData = await this.customFieldDataService.getCustomFieldData(
      {
        where: whereClause,
      },
    );

    const totalAttachedFieldsWithStage = dataForCustomFieldIntegrations.length;
    const totalCompletedFieldsOfCurrentOpportunityUnderStage =
      customFieldData.length;
    const dataForOpportunity = await this.stageAssignmentSettingService.getStageAssignmentSettings(
      {
        entityObjectId: opportunity.id,
        entityType: opportunityEntityType.id,
      },
    );
    const finalData: { total?: number; completed: number } = {
      completed: totalCompletedFieldsOfCurrentOpportunityUnderStage,
    };
    if (dataForOpportunity[0].allAssigneesCompleted) {
      finalData.total = totalAttachedFieldsWithStage;
    } else if (
      !dataForOpportunity[0].allAssigneesCompleted &&
      dataForOpportunity[0].minimumResponses &&
      dataForOpportunity[0].minimumResponses <= totalAttachedFieldsWithStage
    ) {
      finalData.total = dataForOpportunity[0].minimumResponses;
    }
    return finalData;
  }

  /**
   * Get current stage assignees (users) for given assignee settings.
   */
  async getNotifiableUsersFromSettings(
    opportunityId: number,
    notificationSetting: StageNotificationSettingsInterface,
  ): Promise<Array<{}>> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
      relations: [
        'opportunityUsers',
        'opportunityUsers.user',
        'opportunityUsers.user.profileImage',
      ],
    });

    let users = [];

    // Find group users
    if (notificationSetting.groups && notificationSetting.groups.length) {
      users = users.concat(
        await this.circleService.getCircleUsers({
          where: {
            id: In(notificationSetting.groups),
            community: opportunity.communityId,
          },
        }),
      );
    }

    // Find individual users
    if (
      notificationSetting.individuals &&
      notificationSetting.individuals.length
    ) {
      users = users.concat(
        await this.userService.getUsers({
          where: { id: In(notificationSetting.individuals) },
          relations: ['profileImage'],
        }),
      );
    }

    // Find users for opportunity roles
    users = users.concat(
      this.getOpportunityRoleAssignees(notificationSetting, opportunity),
    );

    // Find Followers
    if (notificationSetting.followers) {
      users = users.concat(await this.getAllFollowers(opportunity.id));
    }

    // Find Voters
    if (notificationSetting.voters) {
      users = users.concat(await this.getAllVoters(opportunity.id));
    }

    return _.uniqBy(users, 'id');
  }

  async getAllVoters(opportunity: number): Promise<UserEntity[]> {
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    return (await this.voteService.getAllVote({
      where: {
        entityObjectId: opportunity,
        entityType: entityType.id,
        voteType: VoteType.UPVOTE,
      },
      relations: ['user'],
      order: {
        id: 'DESC',
      },
    })).map(vote => vote.user);
  }

  async getAllFollowers(opportunity: number): Promise<UserEntity[]> {
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    const followingContents = await this.followingContentService.getFollowingContents(
      {
        where: {
          entityObjectId: opportunity,
          entityType: entityType,
        },
        relations: ['userFollowingContents', 'userFollowingContents.user'],
      },
    );

    let followers = [];
    if (followingContents && followingContents.length) {
      followers = followingContents[0].userFollowingContents.map(
        userFollow => userFollow.user,
      );
    }

    return followers;
  }
  /**
   * Increase View Count of a Opportunity
   */
  async increaseViewCount(options: {}, data: {}): Promise<{}> {
    const opportunity = await this.getOneOpportunity(options);
    if (!data['viewCount']) {
      data['viewCount'] = BigInt(opportunity.viewCount) + BigInt(1);
    } else {
      data['viewCount'] =
        BigInt(opportunity.viewCount) + BigInt(data['viewCount']);
    }
    return this.opportunityRepository.update(options, data);
  }

  /**
   * Attaches a stage with an opportunity
   * @param stage Stage to be attached with the opportunity.
   * @param opportunity Opportunity to which stage needs to be attached.
   * @param originUrl Origin Url of the request (for email and redirection purposes).
   */
  async attachStageToOpportunity(
    stage: StageEntity,
    opportunity: OpportunityEntity,
    originUrl: string,
  ): Promise<void> {
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    // Update exiting stage history if any.
    if (opportunity.stage) {
      let computeObject = {};
      if (
        opportunity.stage.actionItem.abbreviation ===
        ACTION_ITEM_ABBREVIATIONS.SCORECARD
      ) {
        const stageEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
          ENTITY_TYPES.STAGE,
        );
        computeObject = await this.evaluationCriteriaService.getEvaluationsEntityScores(
          {
            entityObjectId: opportunity.stage.id,
            entityType: stageEntityType.id,
            opportunity: opportunity.id,
            community: opportunity.communityId,
          },
        );
      }
      NotificationHookService.addStageHistory({
        oldStageData: {
          actionItem: opportunity.stage.actionItem,
          stage: opportunity.stage,
          opportunity,
          computeObject,
          enteringAt: moment().format(),
          exitingAt: moment().format(),
          community: opportunity.community,
        },
      });
    }

    // Attach stage & workflow with opportunity.
    await this.updateOpportunityBulk(
      { id: opportunity.id },
      {
        workflow: stage.workflow,
        stage: stage,
        stageAttachmentDate: moment().format('YYYY-MM-DD'),
      },
    );

    await this.addOpportunityStageData(
      {
        assigneeSettings: this.removeUncessaryColumns(
          stage['assigneeSettings'],
        ),
        stageActivityVisibilitySettings: this.removeUncessaryColumns(
          stage['stageActivityVisibilitySettings'],
        ),
        stageAssignmentSettings: this.removeUncessaryColumns(
          stage['stageAssignmentSettings'],
        ),
        stageNotificationSettings: this.removeUncessaryColumns(
          stage['stageNotificationSettings'],
        ),
      },
      opportunity.id,
      opportunity.communityId,
    );

    // Add Stage History
    NotificationHookService.addStageHistory({
      oldStageData: {
        actionItem: stage.actionItem,
        stage,
        opportunity,
        computeObject: {},
        enteringAt: moment().format(),
        community: opportunity.community,
      },
    });

    // Save Action Item Log.
    this.sendActionItemNotificationOnStageChange({
      opportunity: { ...opportunity, stage: stage },
      stageAssignmentSettings: this.removeUncessaryColumns(
        stage['stageAssignmentSettings'],
      ) as AddStageAssignmentSettingsDto,
      entityType: oppEntityType,
      originUrl: originUrl,
    });

    // Add Stage Emails.
    if (stage.actionItem.abbreviation !== ACTION_ITEM_ABBREVIATIONS.NO_TOOL) {
      const currentAssignees = await this.getCurrentStageAssignees(
        opportunity.id,
      );
      NotificationHookService.addStageEmailHook({
        emailType: 'notification',
        entityType: oppEntityType.id,
        entityObjectId: opportunity.id,
        users: currentAssignees,
        stageId: stage.id,
        reminderFrequency:
          REMINDER_FREQUENCY_MAPPING[
            _.toUpper(stage['stageAssignmentSettings'].emailReminder)
          ],
        actionType: '',
        community: opportunity.communityId,
      });
    }
  }

  removeUncessaryColumns(settings: {}): {} {
    return {
      ...settings,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      createdBy: undefined,
      updatedBy: undefined,
    };
  }

  async getOpportunityFilteredData(params): Promise<any[]> {
    let whereClause = {};
    if (params.challenge) {
      whereClause = { ...{ challenge: params.challenge } };
    } else {
      whereClause = { ...{ community: params.community } };
    }

    const opportunities = await this.getOpportunities({
      where: whereClause,
      relations: ['user'],
    });

    if (!opportunities.length) {
      return [];
    }

    const allOpportunitites = [];
    const postedByMeOpportunities = [];
    const tagsByOpportunity = {};
    const totalUniqueTags = [];
    _.mapKeys(opportunities, (val: OpportunityEntity) => {
      if (val.tags.length) {
        tagsByOpportunity[val.id] = val.tags;
        totalUniqueTags.push(val.tags);
      }
      allOpportunitites.push(val.id);
      if (val.user.id === params.userData.id) {
        postedByMeOpportunities.push(val.id);
      }
    });
    let bookmarks;
    let follows;
    let votes;
    // let opportunityTypes;
    let postedByMe;
    if (allOpportunitites.length) {
      if (params.bookmarkedByMe) {
        bookmarks = await this.bookmarkService.getBookmarkCounts(
          params.user || params.userData.id,
          params.entityType,
          allOpportunitites,
        );
      }
      if (params.followedByMe) {
        follows = await this.followingContentService.getFollowingCounts(
          params.user || params.userData.id,
          params.entityType,
          allOpportunitites,
        );
      }
      if (params.votedFor) {
        votes = await this.voteService.getVoteCounts(
          params.user || params.userData.id,
          params.entityType,
          allOpportunitites,
        );
      }
      if (params.postedByMe) {
        postedByMe = postedByMeOpportunities;
      }

      //   opportunityTypes = await this.opportunityService.getOpportunityCountByType(
      //     allOpportunitites,
      //   );
      const selectedOpportunities = _.flatMapDeep([
        _.map(bookmarks, 'ids'),
        _.map(follows, 'ids'),
        _.map(votes, 'ids'),
        // _.map(opportunityTypes, 'ids'),
        postedByMe,
      ]);
      return selectedOpportunities;
    }
  }

  async stageCompletionStats(
    opportunity: OpportunityEntity,
    stageEntityType,
    opportunityEntityType,
  ): Promise<{}> {
    const dataForOpportunity = await this.stageAssignmentSettingService.getStageAssignmentSettings(
      {
        entityObjectId: opportunity.id,
        entityType: opportunityEntityType.id,
      },
    );

    let finalData = { total: 0, completed: 0, opportunityId: opportunity.id };

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
          where: { field: In(fieldIds), opportunity: opportunity.id },
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
        opportunityId: opportunity.id,
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

      const stageAssignees = await this.getCurrentStageAssignees(
        parseInt(opportunity.id.toString()),
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
        opportunityId: opportunity.id,
      };
    }
    return finalData;
  }
  async getDataForAnalyticsForTimeSeries(
    opportunityIds,
    communityId,
    opportunityTypeIds,
  ) {
    let typeIdClause = '';
    if (!_.isEmpty(opportunityTypeIds)) {
      typeIdClause = `AND opportunity_type_id in (${opportunityTypeIds})`;
    }
    const monthly = await this.opportunityRepository.query(
      `select opportunity_type_id, count(*),date_trunc('month', created_at) from public.opportunity where community_id = ${communityId} AND id in (${opportunityIds}) ${typeIdClause} group by opportunity_type_id, date_trunc('month', created_at);`,
    );
    const weekly = await this.opportunityRepository.query(
      `select opportunity_type_id, count(*),date_trunc('week', created_at) from public.opportunity where community_id = ${communityId} AND id in (${opportunityIds}) ${typeIdClause} group by opportunity_type_id, date_trunc('week', created_at);`,
    );
    const daily = await this.opportunityRepository.query(
      `select opportunity_type_id, count(*),date_trunc('day', created_at) from public.opportunity where community_id = ${communityId} AND id in (${opportunityIds}) ${typeIdClause} group by opportunity_type_id, date_trunc('day', created_at);`,
    );
    return {
      monthly,
      weekly,
      daily,
    };
  }
}
