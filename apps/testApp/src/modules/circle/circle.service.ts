import { Injectable } from '@nestjs/common';
import { CircleRepository } from './circle.repository';
import { CircleEntity } from './circle.entity';
import { Brackets } from 'typeorm';
import { BOOLEAN } from '../../common/constants/constants';
import { UserEntity } from '../user/user.entity';
import { flatten } from 'lodash';

@Injectable()
export class CircleService {
  constructor(public readonly circleRepository: CircleRepository) {}

  /**
   * Get
   */
  async getCircles(options: {}): Promise<CircleEntity[]> {
    return this.circleRepository.find(options);
  }
  /**
   * GetCount
   */
  async getCount(options: {}): Promise<number> {
    return this.circleRepository.count(options);
  }

  /**
   * Get
   */
  async searchCircles(
    take,
    skip,
    searchKeys: { name: string },
    showArcived: string,
    communityId: string,
  ): Promise<{}> {
    return this.circleRepository
      .createQueryBuilder('circle')
      .leftJoinAndSelect('circle.circleUsers', 'circleUsers')
      .leftJoinAndSelect('circle.community', 'community')
      .leftJoinAndSelect('circleUsers.user', 'user')
      .where('community.id = :communityId', {
        communityId: communityId,
      })
      .andWhere(
        new Brackets(qb => {
          if (showArcived !== BOOLEAN.FALSE) {
            qb.orWhere('circle.isDeleted = :isDeleted', {
              isDeleted: true,
            });
          } else {
            qb.orWhere('circle.isDeleted = :isDeleted', {
              isDeleted: false,
            });
          }
        }),
      )
      .andWhere(
        new Brackets(qb => {
          qb.orWhere('LOWER(circle.name) like :name', {
            name: `%${searchKeys.name.toLowerCase()}%`,
          });
          qb.orWhere('LOWER(circle.displayName) like :name', {
            name: `%${searchKeys.name.toLowerCase()}%`,
          });
        }),
      )
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }
  /**
   * Get
   */
  async getCircleCount(showArcived: string, communityId: string): Promise<{}> {
    return this.circleRepository
      .createQueryBuilder('circle')
      .leftJoinAndSelect('circle.circleUsers', 'circleUsers')
      .leftJoinAndSelect('circle.community', 'community')
      .where('community.id = :communityId', {
        communityId: communityId,
      })
      .andWhere(
        new Brackets(qb => {
          if (showArcived !== BOOLEAN.FALSE) {
            qb.orWhere('circle.isDeleted = :isDeleted', {
              isDeleted: true,
            });
          } else {
            qb.orWhere('circle.isDeleted = :isDeleted', {
              isDeleted: false,
            });
          }
        }),
      )
      .getCount();
  }

  async getCircleUsers(options: {}): Promise<UserEntity[]> {
    const groups = await this.getCircles({
      ...options,
      relations: [
        'circleUsers',
        'circleUsers.user',
        'circleUsers.user.profileImage',
      ],
    });

    return flatten(groups.map(group => group.circleUsers.map(cu => cu.user)));
  }

  /**
   * Add
   */
  async addCircle(data: {}): Promise<CircleEntity> {
    const themeCreated = this.circleRepository.create(data);
    return this.circleRepository.save(themeCreated);
  }

  /**
   * Update
   */
  async updateCircle(options: {}, data: {}): Promise<{}> {
    return this.circleRepository.update(options, data);
  }

  /**
   * Delete
   */
  async deleteCircle(options: {}): Promise<{}> {
    return this.circleRepository.delete(options);
  }
}
