import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity } from './user.entity';
import { UserRegisterDto } from './dto/UserRegisterDto';
import { Brackets } from 'typeorm';
import { BOOLEAN } from '../../common/constants/constants';
import {
  ClientProxyFactory,
  Transport,
  ClientProxy,
} from '@nestjs/microservices';
import { ConfigService } from '../../shared/services/config.service';
import { UtilsService } from '../../providers/utils.service';
import * as _ from 'lodash';
import { ElasticSearchService } from '../../shared/services/elasticSearchHook';
const configService = new ConfigService();
@Injectable()
export class UserService {
  private client: ClientProxy;

  constructor(
    public readonly userRepository: UserRepository,
    private readonly elasticSearchService: ElasticSearchService,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        url: configService.get('REDIS_URL'),
      },
    });
  }

  /**
   * Get user
   */
  async getUsers(options: {}): Promise<UserEntity[]> {
    return this.userRepository.find(options);
  }

  /**
   * Get one user
   */
  async getOneUser(options: {}): Promise<UserEntity> {
    return this.userRepository.findOne(options);
  }

  /**
   * Get user
   */
  async getUsersWithCommunity(communityId): Promise<UserEntity[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userCommunities', 'userCommunities')
      .leftJoinAndSelect('userCommunities.community', 'community')
      .leftJoinAndSelect('user.profileImage', 'profileImage')
      .where('userCommunities.communityId = :communityId', {
        communityId: communityId,
      })
      .getMany();
  }
  /**
   * Get user
   */
  async getUserWithSpecificCommunity(userId, communityId): Promise<UserEntity> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userCommunities', 'userCommunities')
      .leftJoinAndSelect('userCommunities.community', 'community')
      .where('user.id = :userId', {
        userId: userId,
      })
      .andWhere('userCommunities.communityId = :communityId', {
        communityId: communityId,
      })
      .getOne();
  }
  /**
   * Get user
   */
  async getUserWithSpecificSelect(userId, selectClause): Promise<UserEntity> {
    return this.userRepository
      .createQueryBuilder('user')
      .select(selectClause)
      .where('user.id = :userId', {
        userId: userId,
      })
      .getOne();
  }

  /**
   * Add user
   */
  async addUser(data: UserRegisterDto): Promise<UserEntity> {
    const userCreated = this.userRepository.create(data);
    return this.userRepository.save(userCreated);
  }

  /**
   * Add user without DTO
   */
  async addUserWithoutDto(data: {}): Promise<UserEntity> {
    const userCreated = this.userRepository.create(data);
    return this.userRepository.save(userCreated);
  }

  /**
   * Update user
   */
  async updateUser(
    options: {},
    data: {},
    community,
    updateInElastic = false,
  ): Promise<{}> {
    const updatedUserData = await this.userRepository.update(options, data);
    if (updateInElastic) {
      const userObject = await this.getOneUser({
        where: { id: options['id'] },
      });
      userObject['communityId'] = community;

      this.elasticSearchService.editUserData({
        id: userObject.id,
        firstName: userObject.firstName,
        lastName: userObject.lastName,
        userName: userObject.userName,
        email: userObject.email,
        secondaryEmail: userObject.secondaryEmail,
        profileBio: userObject.profileBio,
        skills: userObject.skills,
        region: userObject.region,
        country: userObject.country,
        city: userObject.city,
        zipCode: userObject.zipCode,
        timeZone: userObject.timeZone,
        latLng: userObject.latLng,
        position: userObject.position,
        company: userObject.company,
        communityId: userObject['communityId'],
        isDeleted: userObject.isDeleted,
      });
    }
    return updatedUserData;
  }

  /**
   * Delete user
   */
  async deleteUser(options: {}): Promise<{}> {
    return this.userRepository.delete(options);
  }

  /**
   * Get
   */
  async searchUserCircles(
    take,
    skip,
    communityId,
    circleId,
    showArcived,
    searchKeys: { name: string; userName: string; email: string },
  ): Promise<{}> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userCircles', 'userCircles')
      .leftJoinAndSelect('userCircles.circle', 'circle')
      .leftJoinAndSelect('user.userCommunities', 'userCommunities')
      .where('userCommunities.communityId = :communityId', {
        communityId: communityId,
      })
      .andWhere('userCircles.circle = :circleId', {
        circleId: circleId,
      })
      .andWhere(
        new Brackets(qb => {
          if (showArcived !== BOOLEAN.FALSE) {
            qb.andWhere('user.isDeleted = :isDeleted', {
              isDeleted: true,
            });
          } else {
            qb.andWhere('user.isDeleted = :isDeleted', {
              isDeleted: false,
            });
          }
        }),
      )
      .andWhere(
        new Brackets(qb => {
          if (searchKeys.name) {
            qb.orWhere('LOWER(user.firstName) like :name', {
              name: `%${searchKeys.name.toLowerCase()}%`,
            });
            qb.orWhere('LOWER(user.lastName) like :name', {
              name: `%${searchKeys.name.toLowerCase()}%`,
            });
          }
          if (searchKeys.userName) {
            qb.orWhere('LOWER(user.userName) like :userName', {
              userName: `%${searchKeys.userName.toLowerCase()}%`,
            });
          }
          if (searchKeys.email) {
            qb.orWhere('LOWER(user.email) like :email', {
              email: `%${searchKeys.email.toLowerCase()}%`,
            });
          }
          if (!searchKeys.name && !searchKeys.userName && !searchKeys.email) {
            qb.orWhere('1 = :trueCase', {
              trueCase: 1,
            });
          }
        }),
      )
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }
  /**
   * Get
   */
  async searchUserCommunities(
    take,
    skip,
    communityId,
    showArcived,
    searchKeys: { name: string; userName: string; email: string },
  ): Promise<{}> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userCircles', 'userCircles')
      .leftJoinAndSelect('userCircles.circle', 'circle')
      .leftJoinAndSelect('user.userCommunities', 'userCommunities')
      .leftJoinAndSelect('user.profileImage', 'profileImage')
      .where('userCommunities.communityId = :communityId', {
        communityId: communityId,
      })
      .andWhere(
        new Brackets(qb => {
          if (showArcived !== BOOLEAN.FALSE) {
            qb.andWhere('userCommunities.isDeleted = :isDeleted', {
              isDeleted: true,
            });
          } else {
            qb.andWhere('userCommunities.isDeleted = :isDeleted', {
              isDeleted: false,
            });
          }
        }),
      )
      .andWhere(
        new Brackets(qb => {
          if (searchKeys.name) {
            qb.orWhere('LOWER(user.firstName) like :name', {
              name: `%${searchKeys.name.toLowerCase()}%`,
            });
            qb.orWhere('LOWER(user.lastName) like :name', {
              name: `%${searchKeys.name.toLowerCase()}%`,
            });
          }
          if (searchKeys.userName) {
            qb.orWhere('LOWER(user.userName) like :userName', {
              userName: `%${searchKeys.userName.toLowerCase()}%`,
            });
          }
          if (searchKeys.email) {
            qb.orWhere('LOWER(user.email) like :email', {
              email: `%${searchKeys.email.toLowerCase()}%`,
            });
          }
          if (!searchKeys.name && !searchKeys.userName && !searchKeys.email) {
            qb.orWhere('1 = :trueCase', {
              trueCase: 1,
            });
          }
        }),
      )
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  /**
   * Get
   */
  async getCircleUserCount(communityId, circleId, showArcived): Promise<{}> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userCircles', 'userCircles')
      .leftJoinAndSelect('userCircles.circle', 'circle')
      .leftJoinAndSelect('user.userCommunities', 'userCommunities')
      .where('userCommunities.communityId = :communityId', {
        communityId: communityId,
      })
      .andWhere('userCircles.circle = :circleId', {
        circleId: circleId,
      })
      .andWhere(
        new Brackets(qb => {
          if (showArcived !== BOOLEAN.FALSE) {
            qb.andWhere('user.isDeleted = :isDeleted', {
              isDeleted: true,
            });
          } else {
            qb.andWhere('user.isDeleted = :isDeleted', {
              isDeleted: false,
            });
          }
        }),
      )
      .getCount();
  }
  /**
   * Get
   */
  async getCommunityUserCount(communityId, showArcived): Promise<{}> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userCircles', 'userCircles')
      .leftJoinAndSelect('userCircles.circle', 'circle')
      .leftJoinAndSelect('user.userCommunities', 'userCommunities')
      .where('userCommunities.communityId = :communityId', {
        communityId: communityId,
      })
      .andWhere(
        new Brackets(qb => {
          if (showArcived !== BOOLEAN.FALSE) {
            qb.andWhere('userCommunities.isDeleted = :isDeleted', {
              isDeleted: true,
            });
          } else {
            qb.andWhere('userCommunities.isDeleted = :isDeleted', {
              isDeleted: false,
            });
          }
        }),
      )
      .getCount();
  }

  /**
   * Add reset password email
   */
  async addResetPasswordEmail(_data: {
    code;
    to: string;
    firstName: string;
    url;
    community;
    communityName: string;
  }): Promise<any> {
    const defaultEmailTemplate = _.head(
      await this.client
        .send('getDefaultEmailTemplates', { name: 'Default Email Template' })
        .toPromise(),
    );
    const forgotPasswordEmailTemplate = _.head(
      await this.client
        .send('getEmailTemplateForCommunity', {
          name: 'Forgot Password',
          community: _data.community,
        })
        .toPromise(),
    );
    forgotPasswordEmailTemplate['body'] = forgotPasswordEmailTemplate[
      'body'
    ].replace(
      '{{linkButton}}',
      UtilsService.generateResetPasswordUrlButton(_data.url, _data.code),
    );
    forgotPasswordEmailTemplate['body'] = forgotPasswordEmailTemplate[
      'body'
    ].replace('{{firstName}}', _data.firstName);
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{tagLine}}',
      '',
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{featureImage}}',
      forgotPasswordEmailTemplate['featureImage'],
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{body}}',
      forgotPasswordEmailTemplate['body'],
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{companyName}}',
      _data.communityName,
    );
    forgotPasswordEmailTemplate['subject'] = forgotPasswordEmailTemplate[
      'subject'
    ].replace('{{CommunityName}}', _data.communityName);

    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{ subject }}',
      forgotPasswordEmailTemplate['subject'],
    );
    return this.client
      .send('addSendEmailsData', {
        to: _data.to,
        from: forgotPasswordEmailTemplate['senderEmail'],
        emailContent: defaultEmailTemplate['body'],
        status: 'pending',
        community: _data.community,
        subject: forgotPasswordEmailTemplate['subject'],
      })
      .toPromise();
  }
}
