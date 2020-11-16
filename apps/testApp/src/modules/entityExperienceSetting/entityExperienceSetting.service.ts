import { Injectable } from '@nestjs/common';
import { EntityExperienceSettingRepository } from './entityExperienceSetting.repository';
import { EntityExperienceSettingEntity } from './entityExperienceSetting.entity';
import { head } from 'lodash';

@Injectable()
export class EntityExperienceSettingService {
  constructor(
    public readonly entityExperienceSettingRepository: EntityExperienceSettingRepository,
  ) {}

  /**
   * Get entityExperienceSettings
   */
  async getEntityExperienceSetting(options: {}): Promise<
    EntityExperienceSettingEntity
  > {
    let expSettings = await this.getDeniedExperienceSetting();
    expSettings = {
      ...expSettings,
      ...{ entityObjectId: options['where']['entityObjectId'] },
    };
    const query = this.entityExperienceSettingRepository
      .createQueryBuilder('exp')
      .where('exp.entityObjectId = :entityObjectId', {
        entityObjectId: options['where']['entityObjectId'],
      })
      .andWhere('exp.entityType = :entityType', {
        entityType: options['where']['entityType'],
      });

    if (options['where']['community']) {
      query.andWhere('exp.community = :community', {
        community: options['where']['community'],
      });
    }

    const settingsFound = await query.getMany();
    return { ...expSettings, ...head(settingsFound) };
  }

  /**
   * Get entityExperienceSettings
   */
  async getBulkEntityExperienceSetting(options: {
    where: {
      entityObjectIds: number[];
      entityType: number;
      community?: number;
    };
  }): Promise<EntityExperienceSettingEntity[]> {
    const query = this.entityExperienceSettingRepository
      .createQueryBuilder('exp')
      .where('exp.entityObjectId IN (:...entityObjectIds)', {
        entityObjectIds: options.where.entityObjectIds,
      })
      .andWhere('exp.entityType = :entityType', {
        entityType: options.where.entityType,
      });

    if (options.where.community) {
      query.andWhere('exp.community = :community', {
        community: options.where.community,
      });
    }

    return query.getMany();
  }

  /**
   * Get denied experience settings.
   * @returns EntityExperienceSettingEntity object with all settings set to false.
   */
  async getDeniedExperienceSetting(): Promise<EntityExperienceSettingEntity> {
    const unneededColumns = [
      'id',
      'createdAt',
      'updatedAt',
      'isDeleted',
      'updatedBy',
      'createdBy',
      'entityObjectId',
      'entityType',
      'community',
    ];

    const columns = this.entityExperienceSettingRepository.metadata.ownColumns.map(
      c => c.propertyName,
    );
    const data = {};
    for (const column of columns) {
      if (!unneededColumns.includes(column)) {
        data[column] = false;
      }
    }
    data['defaultSort'] = null;
    return this.entityExperienceSettingRepository.create(data);
  }

  /**
   * Add entityExperienceSetting
   */
  async addEntityExperienceSetting(data: {}): Promise<
    EntityExperienceSettingEntity
  > {
    const entityExperienceSettingCreated = this.entityExperienceSettingRepository.create(
      data,
    );
    return this.entityExperienceSettingRepository.save(
      entityExperienceSettingCreated,
    );
  }

  /**
   * Update entityExperienceSetting
   */
  async updateEntityExperienceSetting(options: {}, data: {}): Promise<{}> {
    return this.entityExperienceSettingRepository.update(options, data);
  }

  /**
   * Delete entityExperienceSetting
   */
  async deleteEntityExperienceSetting(options: {}): Promise<{}> {
    return this.entityExperienceSettingRepository.delete(options);
  }
}
