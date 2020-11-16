import { Injectable } from '@nestjs/common';
import { RoleActorsRepository } from './roleActors.repository';
import { RoleActorsEntity } from './roleActors.entity';
import { CircleService } from '../circle/circle.service';
import { RoleActorTypes } from '../../enum';
// import { EntityExperienceSettingService } from '../entityExperienceSetting/entityExperienceSetting.service';
// import { EntityExperienceSettingEntity } from '../entityExperienceSetting/entityExperienceSetting.entity';
import { CommunityWisePermissionService } from '../communityWisePermission/communityWisePermission.service';
import { CommunityWisePermissionEntity } from '../communityWisePermission/communityWisePermission.entity';

@Injectable()
export class RoleActorsService {
  constructor(
    public readonly roleActorsRepository: RoleActorsRepository,
    private readonly circleService: CircleService,
    // private readonly entityExperienceSettingService: EntityExperienceSettingService,
    private readonly communityWisePermissionService: CommunityWisePermissionService,
  ) {}

  /**
   * Get roleActors
   */
  async getRoleActors(options: {}): Promise<RoleActorsEntity[]> {
    return this.roleActorsRepository.find(options);
  }

  async getActorEntityRoles(
    actorType: string,
    actorId: number,
    entityObjectId: number,
    entityType: number,
    community: number,
  ): Promise<RoleActorsEntity[]> {
    const roleActors = await this.getRoleActors({
      where: { actorId, actorType, entityObjectId, entityType, community },
      relations: ['role'],
    });
    return roleActors;
  }

  async getMyEntityRoles(
    entityObjectId: number,
    entityType: number,
    community: number,
    options: {},
  ): Promise<RoleActorsEntity[]> {
    const actors = await this.getMyEntityActors(
      entityObjectId,
      entityType,
      community,
      options,
    );
    const roleActors = await this.getRoleActors({
      where: actors,
      relations: ['role'],
    });
    return roleActors;
  }

  async getActorsEntityPermissions(
    actors: {}[],
    community: number,
  ): Promise<CommunityWisePermissionEntity> {
    let actorRoles = [];
    if (actors.length > 0) {
      actorRoles = (await this.roleActorsRepository.find({
        where: actors,
      })).map(roleActor => {
        return {
          role: roleActor.roleId,
          community,
        };
      });
    }

    const permissions = await this.communityWisePermissionService.getDeniedPermissions();
    if (actorRoles.length > 0) {
      const savedPermissions = await this.communityWisePermissionService.getCommunityWisePermissions(
        {
          where: actorRoles,
          // relations: ['role'],
        },
      );
      if (savedPermissions.length > 0) {
        for (const permProperty of Object.getOwnPropertyNames(permissions)) {
          for (const perm of savedPermissions) {
            permissions[permProperty] = Math.max(
              permissions[permProperty],
              perm[permProperty],
            );
          }
        }
      }
    }

    return permissions;
  }

  /**
   * Get Actor's Entity Permissions
   */
  async getActorEntityPermissions(
    actorType: string,
    actorId: number,
    entityObjectId: number,
    entityType: number,
    community: number,
  ): Promise<CommunityWisePermissionEntity> {
    return this.getActorsEntityPermissions(
      [{ actorId, actorType, entityObjectId, entityType, community }],
      community,
    );
  }

  async getMyEntityActors(
    entityObjectId: number,
    entityType: number,
    community: number,
    options: {},
  ): Promise<{}[]> {
    const actors = (await this.circleService.getCircles(options)).map(
      circle => {
        return {
          actorId: circle.id,
          actorType: RoleActorTypes.GROUP,
          entityObjectId,
          entityType,
          community,
        };
      },
    );
    actors.push({
      actorId: options['userId'],
      actorType: RoleActorTypes.USER,
      entityObjectId,
      entityType,
      community,
    });
    return actors;
  }

  /**
   * Get Entity Permissions
   */
  async getEntityPermissions(
    entityObjectId: number,
    entityType: number,
    community: number,
    options: {},
  ): Promise<CommunityWisePermissionEntity> {
    const actors = await this.getMyEntityActors(
      entityObjectId,
      entityType,
      community,
      options,
    );
    return this.getActorsEntityPermissions(actors, community);
  }

  /**
   * Add roleActors
   */
  async addRoleActors(data: {}): Promise<RoleActorsEntity> {
    const roleActorsCreated = this.roleActorsRepository.create(data);
    return this.roleActorsRepository.save(roleActorsCreated);
  }

  /**
   * Update roleActors
   */
  async updateRoleActors(options: {}, data: {}): Promise<{}> {
    return this.roleActorsRepository.update(options, data);
  }

  /**
   * Hard Delete roleActors
   */
  async deleteRoleActors(options: {}): Promise<{}> {
    return this.roleActorsRepository.delete(options);
  }
}
