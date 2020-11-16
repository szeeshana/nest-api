import { Injectable, ForbiddenException } from '@nestjs/common';
import { OpportunityTypeRepository } from './opportunityType.repository';
import { OpportunityTypeEntity } from './opportunityType.entity';
import { RoleActorsService } from '../roleActors/roleActors.service';
import { EntityMetaService } from '../../shared/services/EntityMeta.service';
import { ENTITY_TYPES } from '../../common/constants/constants';
import { EntityExperienceSettingService } from '../entityExperienceSetting/entityExperienceSetting.service';
import { CommunityService } from '../community/community.service';

@Injectable()
export class OpportunityTypeService {
  constructor(
    public readonly opportunityTypeRepository: OpportunityTypeRepository,
    public readonly roleActorService: RoleActorsService,
    public readonly entityExperienceSettingService: EntityExperienceSettingService,
    private readonly communityService: CommunityService,
  ) {}

  /**
   * Get opportunityTypes
   */
  async getOpportunityTypes(options: {}): Promise<OpportunityTypeEntity[]> {
    return this.opportunityTypeRepository.find(options);
  }

  /**
   * Get single opportunity type.
   */
  async getOpportunityType(options: {}): Promise<OpportunityTypeEntity> {
    return this.opportunityTypeRepository.findOne(options);
  }

  /**
   * Add opportunityType
   */
  async addOpportunityType(data: {}): Promise<OpportunityTypeEntity> {
    const opportunityTypeCreated = this.opportunityTypeRepository.create(data);
    const opportunityTypeSaved = await this.opportunityTypeRepository.save(
      opportunityTypeCreated,
    );

    // Add default experience settings
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.OPPORTUNITY_TYPE,
    );

    const experienceSettings = await this.entityExperienceSettingService.getDeniedExperienceSetting();
    experienceSettings.allowOpportunityOwnership = true;
    experienceSettings.allowOpportunityTeams = true;
    experienceSettings.allowOpportunityCosubmitters = true;
    experienceSettings.community = opportunityTypeSaved.community;
    experienceSettings.entityObjectId = opportunityTypeSaved.id;
    experienceSettings.entityType = entityType;

    await this.entityExperienceSettingService.addEntityExperienceSetting(
      experienceSettings,
    );

    return opportunityTypeSaved;
  }

  /**
   * Get bulk opportunityType Experience Settings
   */
  async getBulkOpportunityTypeExperienceSettings(options: {
    opportunityTypes: number[];
    community: number;
  }): Promise<{}> {
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.OPPORTUNITY_TYPE,
    );

    return this.entityExperienceSettingService.getBulkEntityExperienceSetting({
      where: {
        entityType: entityType.id,
        entityObjectIds: options.opportunityTypes,
        community: options.community,
      },
    });
  }

  /**
   * Get opportunityType Experience Settings
   */
  async getOpportunityTypeExperienceSettings(options: {}): Promise<{}> {
    const opportunityType = await this.opportunityTypeRepository.findOne(
      options,
    );
    if (!opportunityType) {
      return {};
    }
    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.OPPORTUNITY_TYPE,
    );

    return this.entityExperienceSettingService.getEntityExperienceSetting({
      where: {
        entityType: entityType.id,
        entityObjectId: opportunityType.id,
        community: opportunityType.communityId,
      },
    });
  }

  /**
   * Update opportunityType Experience Settings
   */
  async updateOpportunityTypeExperienceSettings(
    options: {},
    data: {},
    userId,
  ): Promise<{}> {
    const opportunityType = await this.opportunityTypeRepository.findOne(
      options,
    );

    const permissions = await this.communityService.getPermissions(
      opportunityType.communityId,
      userId,
    );

    if (!permissions.editOpportunityType) {
      throw new ForbiddenException();
    }

    const entityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.OPPORTUNITY_TYPE,
    );

    return this.entityExperienceSettingService.updateEntityExperienceSetting(
      {
        entityType,
        entityObjectId: opportunityType.id,
        community: opportunityType.communityId,
      },
      data,
    );
  }

  /**
   * Update opportunityType
   */
  async updateOpportunityType(options: {}, data: {}): Promise<{}> {
    return this.opportunityTypeRepository.update(options, data);
  }

  /**
   * Delete opportunityType
   */
  async deleteOpportunityType(options: {}): Promise<{}> {
    return this.opportunityTypeRepository.delete(options);
  }
}
