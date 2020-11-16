import * as _ from 'lodash';

import { Injectable, NotFoundException } from '@nestjs/common';

import {
  ENTITY_TYPES,
  PERMISSIONS_MAP,
} from '../../common/constants/constants';
import { EntityTypeEnum } from '../../enum/entity-type.enum';
import { ParticipantTypeEnum } from '../../enum/participant-type.enum';
import { RoleActorTypes } from '../../enum/role-actor-type.enum';
import { RolesEnum } from '../../enum/roles.enum';
import { UtilsService } from '../../providers/utils.service';
import { EntityMetaService } from '../../shared/services/EntityMeta.service';
import { CommunityWisePermissionEntity } from '../communityWisePermission/communityWisePermission.entity';
import { EntityExperienceSettingService } from '../entityExperienceSetting/entityExperienceSetting.service';
import { EntityTypeService } from '../entityType/entity.service';
import { FollowingContentService } from '../followingContent/followingContent.service';
import { OpportunityEntity } from '../opportunity/opportunity.entity';
import { OpportunityService } from '../opportunity/opportunity.service';
import { PrizeService } from '../prize/prize.service';
import { RoleService } from '../role/role.service';
import { RoleActorsService } from '../roleActors/roleActors.service';
import { ChallengeEntity } from './challenge.entity';
import { ChallengeRepository } from './challenge.repository';
import { ChallengeParticipantRepository } from './challengeParticipant.repository';
import { In } from 'typeorm';
import { EntityVisibilitySettingService } from '../entityVisibilitySetting/entityVisibilitySetting.service';
import { CommunityEntity } from '../community/community.entity';
import { EntityTypeEntity } from '../entityType/entity.entity';
import { DefaultSort } from '../../enum/default-sort.enum';
import { StageService } from '../stage/stage.service';
import { ElasticSearchService } from '../../shared/services/elasticSearchHook';

@Injectable()
export class ChallengeService {
  constructor(
    public readonly challengeRepository: ChallengeRepository,
    public readonly challengeParticipantRepository: ChallengeParticipantRepository,
    public readonly opportunityService: OpportunityService,
    public readonly entityExperienceSettingService: EntityExperienceSettingService,
    public readonly entityTypeService: EntityTypeService,
    public readonly roleActorsService: RoleActorsService,
    public readonly roleService: RoleService,
    public readonly prizeService: PrizeService,
    public readonly followingContentService: FollowingContentService,
    public readonly entityVisibilitySettingService: EntityVisibilitySettingService,
    public readonly stageService: StageService,
    public readonly elasticSearchService: ElasticSearchService,
  ) {}

  /**
   * Get challenges
   */
  async getOneChallenge(options: {}): Promise<ChallengeEntity> {
    return this.challengeRepository.findOne(options);
  }
  async getChallengeCount(options: {}): Promise<number> {
    return this.challengeRepository.count(options);
  }
  async getChallenges(options: {}): Promise<ChallengeEntity[]> {
    return this.challengeRepository.find(options);
  }
  async searchChallenges(options: {
    where: { community?: number; isDeleted?: boolean; id?: number };
    opportunityData?: boolean;
    userId: number;
  }): Promise<{}> {
    let challenges = await this.challengeRepository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect(
        'challenge.challengeParticipant',
        'challengeParticipant',
      )
      .leftJoinAndSelect(
        'challenge.challengeOpportunities',
        'challengeOpportunities',
      )
      .leftJoinAndSelect(
        'challenge.challengeAttachments',
        'challengeAttachments',
      )
      .leftJoinAndSelect(
        'challengeAttachments.userAttachment',
        'userAttachment',
      )
      .leftJoinAndSelect('challenge.opportunityType', 'opportunityType')
      .leftJoinAndSelect('challenge.workflow', 'workflow')
      .andWhere(
        options.where.community ? `challenge.community = :community` : '1=1',
        {
          community: options.where.community,
        },
      )
      .andWhere(
        options.where.isDeleted ? `challenge.isDeleted = :isDeleted` : '1=1',
        {
          isDeleted: options.where.isDeleted,
        },
      )
      .andWhere(options.where.id ? `challenge.id = :id` : '1=1', {
        id: options.where.id,
      })
      .getMany();

    // Filtering only visible challenges.
    const permissions = await Promise.all(
      challenges.map(challenge =>
        this.getPermissions(challenge.id, options.userId, true),
      ),
    );
    const permissionGrouped = _.groupBy(permissions, 'challengeId');
    challenges = challenges.filter(
      challenge =>
        _.head(permissionGrouped[challenge.id])['permissions']['viewChallenge'],
    );

    const opportunityIds = {};
    const getCommentCountArr = [];
    const getVoteCountArr = [];
    _.map(challenges, (val: ChallengeEntity) => {
      if (val.challengeOpportunities.length) {
        opportunityIds[val.id] = _.map(val.challengeOpportunities, 'id');
        val['opportunityCount'] = val.challengeOpportunities.length;
        getCommentCountArr.push(
          this.opportunityService.getCommentCount(opportunityIds[val.id]),
        );
        getVoteCountArr.push(
          this.opportunityService.getVoteCount(opportunityIds[val.id]),
        );
        if (!options.opportunityData) {
          delete val.challengeOpportunities;
        }
      }
    });
    let opportunityCommentCounts = await Promise.all(getCommentCountArr);
    let opportunityVoteCounts = await Promise.all(getVoteCountArr);

    opportunityCommentCounts = _.flatMap(opportunityCommentCounts);
    opportunityVoteCounts = _.flatMap(opportunityVoteCounts);

    // Finding followed challenges
    const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );
    const challengeIds = challenges.map(challenge => challenge.id);

    let challengeFollowersGrouped;
    let allChallengeFollowersGrouped;
    let prizes;

    if (challenges && challenges.length) {
      const challengeFollowers = await this.followingContentService.getUserFollowByEntityObjectIds(
        challengeIds,
        options.userId,
        challengeEntityType.id,
      );
      challengeFollowersGrouped = _.groupBy(
        challengeFollowers,
        'entityObjectId',
      );
      const allChallengeFollowers = await this.followingContentService.getFollowByEntityByEntityObjectId(
        challengeIds,
        challengeEntityType.id,
      );
      allChallengeFollowersGrouped = _.groupBy(
        allChallengeFollowers,
        'entityObjectId',
      );

      prizes = _.groupBy(
        await this.prizeService.getPrizes({
          where: { challenge: In(challengeIds) },
        }),
        'challengeId',
      );
    }

    _.map(challenges, (val: ChallengeEntity) => {
      const foundComments = _.filter(opportunityCommentCounts, function(o) {
        return o.challenge_id == val.id;
      });
      const foundVotes = _.filter(opportunityVoteCounts, function(o) {
        return o.challenge_id == val.id;
      });

      if (foundComments) {
        val['opportunityCommentCounts'] = parseInt(
          _.sumBy(foundComments, 'comment').toString(),
        );
      }
      if (foundVotes) {
        val['opportunityVoteCounts'] = parseInt(
          _.sumBy(foundVotes, 'vote').toString(),
        );
      }

      if (
        allChallengeFollowersGrouped &&
        allChallengeFollowersGrouped[val.id]
      ) {
        const followersCount = (_.head(allChallengeFollowersGrouped[val.id])[
          'userFollowingContents'
        ] as Array<{}>).length;
        val['followersCount'] = followersCount;
      } else {
        val['followersCount'] = 0;
      }

      if (challengeFollowersGrouped && challengeFollowersGrouped[val.id]) {
        val['following'] = true;
        val['followId'] = _.head(challengeFollowersGrouped[val.id])['id'];
      } else {
        val['following'] = false;
      }

      val['prizesCount'] = prizes && prizes[val.id] ? prizes[val.id].length : 0;
    });

    return challenges;
  }
  /**
   * Add challenge
   */
  async addChallenge(data: {}): Promise<ChallengeEntity> {
    const challengeParticipants = data['participants'];
    const entityExperienceSetting = data['entityExperienceSetting'] || {};
    const submissionVisibilitySetting = data['submissionVisibilitySetting'] || {
      public: true,
    };
    let prizes = data['prizes'];
    delete data['prizes'];
    delete data['participants'];
    delete data['entityExperienceSetting'];
    delete data['submissionVisibilitySetting'];

    const challengeCreated = this.challengeRepository.create(data);
    const challenge = await this.challengeRepository.save(challengeCreated);
    this.elasticSearchService.addChallengeData({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      additionalBrief: challenge.additionalBrief,
      communityId: challenge.community,
      isDeleted: challenge.isDeleted,
    });

    const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );

    // save challenge participants
    if (challengeParticipants) {
      for (const participant of challengeParticipants) {
        participant.challenge = challenge.id;
      }
      await this.challengeParticipantRepository.save(
        this.challengeParticipantRepository.create(challengeParticipants),
      );
    }

    // save challenge experience settings
    entityExperienceSetting['community'] = challenge.community;
    entityExperienceSetting['entityObjectId'] = challenge.id;
    entityExperienceSetting['entityType'] = challengeEntityType.id;

    entityExperienceSetting['allowCommenting'] = true;
    entityExperienceSetting['allowSharing'] = true;
    entityExperienceSetting['defaultSort'] = DefaultSort.NEWEST;
    entityExperienceSetting['allowSubmissions'] = true;
    await this.entityExperienceSettingService.addEntityExperienceSetting(
      entityExperienceSetting,
    );

    // Adding Submissions Visibiility Settings
    this.addSubmissionVisibilitySettings(
      submissionVisibilitySetting,
      challenge.id,
      challenge.community,
    );

    // save challenge prizes
    if (prizes) {
      prizes = prizes.map(prize => ({
        ...prize,
        challenge: challenge.id,
        community: challenge.community,
      }));
      await this.prizeService.bulkAddPrizes(prizes);
    }

    // assign users required roles

    const adminRole = await this.roleService.getOneRole({
      where: {
        title: RolesEnum.challengeAdmin,
        community: challenge.community,
      },
    });
    const modRole = await this.roleService.getOneRole({
      where: {
        title: RolesEnum.challengeModerator,
        community: challenge.community,
      },
    });
    const userRole = await this.roleService.getOneRole({
      where: {
        title: RolesEnum.challengeUser,
        community: challenge.community,
      },
    });

    let userRoleActors = challenge.sponsors.map(sp => {
      return {
        role: adminRole,
        actorType: RoleActorTypes.USER,
        actorId: sp,
        entityObjectId: challenge.id,
        entityType: entityExperienceSetting['entityType'],
        community: challenge.community,
      };
    });
    userRoleActors = userRoleActors.concat(
      challenge.moderators.map(mod => {
        return {
          role: modRole,
          actorType: RoleActorTypes.USER,
          actorId: mod,
          entityObjectId: challenge.id,
          entityType: entityExperienceSetting['entityType'],
          community: challenge.community,
        };
      }),
    );
    if (challengeParticipants) {
      userRoleActors = userRoleActors.concat(
        challengeParticipants.map(participant => {
          return {
            role: userRole,
            actorType:
              participant.type === ParticipantTypeEnum.USER
                ? RoleActorTypes.USER
                : RoleActorTypes.GROUP,
            actorId: participant.participantId,
            entityObjectId: challenge.id,
            entityType: entityExperienceSetting['entityType'],
            community: challenge.community,
          };
        }),
      );
    }

    await this.roleActorsService.addRoleActors(userRoleActors);
    return challenge;
  }

  /**
   * Add submission visibility settings for a challenge.
   * @param visibilitySetting Submission visbility settings to add.
   * @param challenge Challenge id for which visibility settings need to be added.
   * @param community Community id for the challenge.
   */
  async addSubmissionVisibilitySettings(
    visibilitySetting: {},
    challenge: number,
    community: number | CommunityEntity,
  ): Promise<{}> {
    const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );
    const visibility = { ...visibilitySetting };
    if (visibilitySetting['private']) {
      const ownerRole = await this.roleService.getRoles({
        where: {
          title: In([
            RolesEnum.admin,
            RolesEnum.moderator,
            RolesEnum.challengeAdmin,
            RolesEnum.challengeModerator,
            RolesEnum.opportunityOwner,
            RolesEnum.opportunityContributor,
            RolesEnum.opportunitySubmitter,
          ]),
          community: community,
        },
      });
      const roleIds = _.map(ownerRole, 'id');
      delete visibility['private'];
      visibility['roles'] = roleIds;
    }
    return this.entityVisibilitySettingService.addEntityVisibilitySetting({
      ...visibility,
      entityType: challengeEntityType.id,
      entityObjectId: challenge,
      community: community,
    });
  }

  /**
   * Update a challenge's submission visibility settings.
   * @param visibilitySetting Updated submission visibility settings.
   * @param challenge Challenge for which visibility settings has to be updated.
   */
  async updateSubmissionVisibilitySettings(
    visibilitySetting: {},
    challenge: ChallengeEntity,
  ): Promise<{}> {
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );
    const visibility = { ...visibilitySetting, roles: [] };
    if (visibilitySetting['private']) {
      const ownerRole = await this.roleService.getRoles({
        where: {
          title: In([
            RolesEnum.admin,
            RolesEnum.moderator,
            RolesEnum.challengeAdmin,
            RolesEnum.challengeModerator,
            RolesEnum.opportunityOwner,
            RolesEnum.opportunityContributor,
            RolesEnum.opportunitySubmitter,
          ]),
          community: challenge.communityId,
        },
      });
      const roleIds = _.map(ownerRole, 'id');
      visibility.roles = roleIds;
    }
    delete visibility['private'];

    this.entityVisibilitySettingService.updateEntityVisibilitySetting(
      {
        entityType: entityType.id,
        entityObjectId: challenge.id,
        community: challenge.communityId,
      },
      visibility,
    );

    // Update all linked opportunities' visibility settings.
    return Promise.all(
      _.map(challenge.challengeOpportunities, (opp: OpportunityEntity) =>
        this.entityVisibilitySettingService.updateEntityVisibilitySetting(
          {
            entityType: oppEntityType,
            entityObjectId: opp.id,
            community: challenge.community.id,
          },
          visibility,
        ),
      ),
    );
  }

  // Archive Challenge
  async archiveChallenge(options: {}, data: {}): Promise<{}> {
    const existingChallenge = await this.getOneChallenge(options);
    if (!existingChallenge) {
      throw new NotFoundException('Challenge does not exist');
    }

    if (!existingChallenge.isDeleted) {
      this.challengeRepository.update(options, data);
      const opportunities = await this.opportunityService.getOpportunities({
        challenge: existingChallenge.id,
      });

      if (opportunities.length) {
        this.opportunityService.updateOpportunityBulk(
          { id: In(_.map(opportunities, o => o.id)) },
          { challenge: null },
        );
      }
    }
    return {
      ...existingChallenge,
      isDeleted: true,
    };
  }

  /**
   * Simply update challenge entity object.
   */
  async simpleUpdateChallenge(options: {}, data: {}): Promise<{}> {
    return this.challengeRepository.update(options, data);
  }

  /**
   * Update challenge
   */
  async updateChallenge(
    options: {},
    data: {},
    originUrl?: string,
  ): Promise<{}> {
    const existingChallenge = await this.getOneChallenge(options);
    if (!existingChallenge) {
      throw new NotFoundException('Challenge does not exists');
    }

    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    const challengeParticipants = data['participants'];
    const entityExperienceSetting = data['entityExperienceSetting'];
    const submissionVisibilitySetting = data['submissionVisibilitySetting'];
    let prizes = data['prizes'];
    delete data['prizes'];
    delete data['participants'];
    delete data['entityExperienceSetting'];
    delete data['submissionVisibilitySetting'];

    const challenge = await this.challengeRepository.update(options, data);
    const challengeData = await this.getOneChallenge({
      where: { id: options['id'] },
    });
    this.elasticSearchService.addChallengeData({
      id: challengeData.id,
      title: challengeData.title,
      description: challengeData.description,
      additionalBrief: challengeData.additionalBrief,
      communityId: challengeData.communityId,
      isDeleted: challengeData.isDeleted,
    });
    if (challengeParticipants !== undefined && challengeParticipants !== null) {
      await this.challengeParticipantRepository.delete({
        challenge: options['id'],
      });

      // update challenge participants
      if (challengeParticipants) {
        for (const participant of challengeParticipants) {
          participant.challenge = options['id'];
        }
        await this.challengeParticipantRepository.save(
          this.challengeParticipantRepository.create(challengeParticipants),
        );
      }
    }

    const updatedChallenge = await this.getOneChallenge({
      where: { ...options },
      relations: ['community', 'challengeOpportunities'],
    });

    // save and update challenge prizes
    if (prizes) {
      prizes = prizes.map(prize => ({
        ...prize,
        challenge: updatedChallenge.id,
        community: updatedChallenge.communityId,
      }));
      let updatedPrizes = prizes.filter(prize => prize.id);
      const newPrizes = _.difference(prizes, updatedPrizes);
      updatedPrizes = updatedPrizes.map(prize => {
        delete prize['challengeId'];
        delete prize['communityId'];
        delete prize['categoryId'];
        delete prize['createdAt'];
        delete prize['updatedAt'];
        delete prize['awardees'];
        return prize;
      });
      const prizePromises = updatedPrizes.map(prize =>
        this.prizeService.updatePrize({ id: prize.id }, prize),
      );
      prizePromises.push(this.prizeService.bulkAddPrizes(newPrizes));
      await Promise.all(prizePromises);
    }

    if (entityExperienceSetting) {
      this.updateExperienceSettings(
        entityExperienceSetting,
        entityType,
        updatedChallenge,
        oppEntityType,
      );
    }

    // Updating Submission Visbility Settings.
    if (submissionVisibilitySetting) {
      this.updateSubmissionVisibilitySettings(
        submissionVisibilitySetting,
        updatedChallenge,
      );
    }

    // Update existing oppotunities workflows.
    if (data['workflow'] && data['workflow'] !== existingChallenge.workflowId) {
      this.updateExistingOpportunitiesWorkflow(updatedChallenge, originUrl);
    }

    // assign users required roles
    // delete existing role actors
    await this.roleActorsService.deleteRoleActors({
      entityObjectId: updatedChallenge.id,
      entityType: entityType,
      community: updatedChallenge.community,
    });

    const adminRole = await this.roleService.getOneRole({
      where: {
        title: RolesEnum.challengeAdmin,
        community: updatedChallenge.community,
      },
    });
    const modRole = await this.roleService.getOneRole({
      where: {
        title: RolesEnum.challengeModerator,
        community: updatedChallenge.community,
      },
    });
    const userRole = await this.roleService.getOneRole({
      where: {
        title: RolesEnum.challengeUser,
        community: updatedChallenge.community,
      },
    });

    // create new role actors
    let userRoleActors = updatedChallenge.sponsors.map(sp => {
      return {
        role: adminRole,
        actorType: RoleActorTypes.USER,
        actorId: sp,
        entityObjectId: updatedChallenge.id,
        entityType: entityType,
        community: updatedChallenge.community,
      };
    });
    userRoleActors = userRoleActors.concat(
      updatedChallenge.moderators.map(mod => {
        return {
          role: modRole,
          actorType: RoleActorTypes.USER,
          actorId: mod,
          entityObjectId: updatedChallenge.id,
          entityType: entityType,
          community: updatedChallenge.community,
        };
      }),
    );

    const updatedParticipants = await this.challengeParticipantRepository.find({
      challenge: options['id'],
    });
    userRoleActors = userRoleActors.concat(
      updatedParticipants.map(participant => {
        return {
          role: userRole,
          actorType:
            participant.type === ParticipantTypeEnum.USER
              ? RoleActorTypes.USER
              : RoleActorTypes.GROUP,
          actorId: participant.participantId,
          entityObjectId: updatedChallenge.id,
          entityType: entityType,
          community: updatedChallenge.community,
        };
      }),
    );
    await this.roleActorsService.addRoleActors(userRoleActors);

    return challenge;
  }

  /**
   * Updates all existing opportunities of a challenge to challenge's workflow.
   * @param challenge Said challenge.
   * @param originUrl Origin Url of the request (for email and redirection purposes).
   */
  private async updateExistingOpportunitiesWorkflow(
    challenge: ChallengeEntity,
    originUrl: string,
  ): Promise<void> {
    const stage = await this.stageService.getOneStage({
      where: { workflow: challenge.workflowId, isDeleted: false },
      order: { orderNumber: 'ASC' },
      relations: ['workflow', 'status', 'actionItem'],
    });
    const opportunities = await this.opportunityService.getOpportunities({
      where: { challenge: challenge.id },
      relations: [
        'challenge',
        'opportunityType',
        'community',
        'stage',
        'stage.actionItem',
      ],
    });
    for (const opportunity of opportunities) {
      this.opportunityService.attachStageToOpportunity(
        stage,
        opportunity,
        originUrl,
      );
    }
  }

  /**
   * Update challenge
   */
  async updateChallengeStatus(options: {}, data: {}): Promise<{}> {
    const existingChallenge = await this.getOneChallenge(options);
    if (!existingChallenge) {
      throw new NotFoundException('Challenge does not exists');
    }

    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );
    const oppEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    );

    const entityExperienceSetting = data['entityExperienceSetting'];
    const submissionVisibilitySetting = data['submissionVisibilitySetting'];
    delete data['entityExperienceSetting'];
    delete data['submissionVisibilitySetting'];

    if (!entityExperienceSetting.displayAlert) {
      data['alertMessage'] = null;
    }

    const updateResponse = await this.challengeRepository.update(options, data);

    const updatedChallenge = await this.getOneChallenge({
      where: { ...options },
      relations: ['community', 'challengeOpportunities'],
    });

    if (entityExperienceSetting) {
      this.updateExperienceSettings(
        entityExperienceSetting,
        entityType,
        updatedChallenge,
        oppEntityType,
      );
    }

    // Updating Submission Visbility Settings.
    if (submissionVisibilitySetting) {
      this.updateSubmissionVisibilitySettings(
        submissionVisibilitySetting,
        updatedChallenge,
      );
    }
    return updateResponse;
  }

  private async updateExperienceSettings(
    entityExperienceSetting: any,
    entityType: EntityTypeEntity,
    updatedChallenge: ChallengeEntity,
    oppEntityType: EntityTypeEntity,
  ): Promise<void> {
    // save challenge experience settings
    await this.entityExperienceSettingService.updateEntityExperienceSetting(
      {
        entityType: entityType,
        entityObjectId: updatedChallenge.id,
        community: updatedChallenge.community.id,
      },
      entityExperienceSetting,
    );

    // update all linked opportunities' experience settings
    await Promise.all(
      _.map(updatedChallenge.challengeOpportunities, (opp: OpportunityEntity) =>
        this.entityExperienceSettingService.updateEntityExperienceSetting(
          {
            entityType: oppEntityType,
            entityObjectId: opp.id,
            community: updatedChallenge.community.id,
          },
          {
            ...entityExperienceSetting,
            entityType: oppEntityType,
            entityObjectId: opp.id,
          },
        ),
      ),
    );
  }

  /**
   * Increase View Count of a Challenge
   */
  async increaseViewCount(options: {}, data: {}): Promise<{}> {
    const challenge = await this.getOneChallenge(options);
    if (!data['viewCount']) {
      data['viewCount'] = BigInt(challenge.viewCount) + BigInt(1);
    } else {
      data['viewCount'] =
        BigInt(challenge.viewCount) + BigInt(data['viewCount']);
    }
    return this.simpleUpdateChallenge(options, data);
  }

  async getPostOpportunityPermissions(challengeIds: number[]): Promise<{}[]> {
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    );

    const expSettings = await Promise.all(
      challengeIds.map(challenge =>
        this.entityExperienceSettingService.getEntityExperienceSetting({
          where: {
            entityObjectId: challenge,
            entityType: entityType.id,
          },
        }),
      ),
    );

    const expSettingsGrouped = _.groupBy(expSettings, 'entityObjectId');
    return challengeIds.map(challenge => ({
      challenge,
      postOpportunity:
        _.head(expSettingsGrouped[challenge]) &&
        _.head(expSettingsGrouped[challenge]).allowSubmissions
          ? PERMISSIONS_MAP.ALLOW
          : PERMISSIONS_MAP.DENY,
    }));
  }

  async getPermissions(
    challengeId: number,
    userId: number,
    returnWithId?: boolean,
  ): Promise<CommunityWisePermissionEntity | {}> {
    const options = { userId };
    const challenge = (await this.getChallenges({
      where: { id: challengeId },
      relations: ['challengeParticipant'],
    }))[0];
    const permissions = await this.roleActorsService.getEntityPermissions(
      null,
      null,
      challenge.communityId,
      options,
    );
    const entityType = (await this.entityTypeService.getEntityTypes({
      where: {
        abbreviation: EntityTypeEnum.challenge,
      },
    }))[0];
    const challengePermissions = await this.roleActorsService.getEntityPermissions(
      challengeId,
      entityType.id,
      challenge.communityId,
      options,
    );

    for (const permProperty of Object.getOwnPropertyNames(permissions)) {
      permissions[permProperty] = Math.max(
        permissions[permProperty],
        challengePermissions[permProperty],
      );
    }

    const challengeExpSettings = await this.entityExperienceSettingService.getEntityExperienceSetting(
      {
        where: {
          entityObjectId: challengeId,
          entityType: entityType.id,
          community: challenge.communityId,
        },
      },
    );
    permissions.voteOpportunity = UtilsService.checkScenarioPermission(
      permissions.voteOpportunity,
      challengeExpSettings.allowVoting,
    );
    permissions.shareOpportunity = UtilsService.checkScenarioPermission(
      permissions.shareOpportunity,
      challengeExpSettings.allowSharing,
    );
    permissions.postComments = UtilsService.checkScenarioPermission(
      permissions.postComments,
      challengeExpSettings.allowCommenting,
    );

    // Updating post opportunity permissions.
    permissions.postOpportunity = challengeExpSettings.allowSubmissions
      ? PERMISSIONS_MAP.ALLOW
      : PERMISSIONS_MAP.DENY;

    // View Challenge Permissions based on challenge's participants.
    if (permissions.viewChallenge === PERMISSIONS_MAP.SCENARIO) {
      if (
        !challenge.challengeParticipant ||
        !challenge.challengeParticipant.length
      ) {
        permissions.viewChallenge = PERMISSIONS_MAP.ALLOW;
      } else {
        permissions.viewChallenge = PERMISSIONS_MAP.DENY;
      }
    }

    return returnWithId
      ? {
          permissions,
          challengeId,
        }
      : permissions;
  }

  /**
   * Hard Delete challenge
   */
  async deleteChallenge(options: {}): Promise<{}> {
    await this.challengeParticipantRepository.delete({
      challenge: options['id'],
    });
    return this.challengeRepository.delete(options);
  }
}
