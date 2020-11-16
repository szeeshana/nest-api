import { Injectable } from '@nestjs/common';
import { CommunityWisePermissionRepository } from './communityWisePermission.repository';
import { CommunityWisePermissionEntity } from './communityWisePermission.entity';

@Injectable()
export class CommunityWisePermissionService {
  constructor(
    public readonly communityWisePermissionRepository: CommunityWisePermissionRepository,
  ) {}

  /**
   * Get communityWisePermissions
   */
  async getCommunityWisePermissions(options: {}): Promise<
    CommunityWisePermissionEntity[]
  > {
    return this.communityWisePermissionRepository.find(options);
  }

  /**
   * Add communityWisePermission
   */
  async addCommunityWisePermission(data: {}): Promise<
    CommunityWisePermissionEntity
  > {
    const communityWisePermissionCreated = this.communityWisePermissionRepository.create(
      data,
    );
    return this.communityWisePermissionRepository.save(
      communityWisePermissionCreated,
    );
  }

  /**
   * Get denied community wise permissions.
   * @returns CommunityWisePermissionEntity object with all permissions set to 0.
   */
  async getDeniedPermissions(): Promise<CommunityWisePermissionEntity> {
    const unneededColumns = [
      'id',
      'createdAt',
      'updatedAt',
      'isDeleted',
      'updatedBy',
      'createdBy',
      'role',
      'community',
    ];

    const columns = this.communityWisePermissionRepository.metadata.ownColumns.map(
      c => c.propertyName,
    );
    const data = {};
    for (const column of columns) {
      if (!unneededColumns.includes(column)) {
        data[column] = 0;
      }
    }

    return this.communityWisePermissionRepository.create(data);
  }

  /**
   * Update communityWisePermission
   */
  async updateCommunityWisePermission(options: {}, data: {}): Promise<{}> {
    return this.communityWisePermissionRepository.update(options, data);
  }

  /**
   * Delete communityWisePermission
   */
  async deleteCommunityWisePermission(options: {}): Promise<{}> {
    return this.communityWisePermissionRepository.delete(options);
  }
}
