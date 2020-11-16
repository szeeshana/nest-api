import { Injectable } from '@nestjs/common';
import { InviteRepository } from './invite.repository';
import { InviteEntity } from './invite.entity';
import { UserService } from '../user/user.service';
import { In, Brackets } from 'typeorm';
import * as _ from 'lodash';
import { ConfigService } from '../../shared/services/config.service';
import { UtilsService } from '../../providers/utils.service';
import {
  ClientProxyFactory,
  Transport,
  ClientProxy,
} from '@nestjs/microservices';
import { CircleService } from '../circle/circle.service';
import { InviteStatus } from '../../enum';
import * as moment from 'moment';
import * as bcrypt from 'bcrypt';
import { CommunityService } from '../community/community.service';

const configService = new ConfigService();

@Injectable()
export class InviteService {
  private client: ClientProxy;

  constructor(
    public readonly inviteRepository: InviteRepository,
    public readonly userService: UserService,
    public readonly circleService: CircleService,
    public readonly communityService: CommunityService,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        url: configService.get('REDIS_URL'),
      },
    });
  }

  /**
   * Get invites' counts.
   */
  async getInvitesCounts(options: {
    community: number;
  }): Promise<{
    all: number;
    pending: number;
    accepted: number;
  }> {
    const allInvites = await this.inviteRepository.findAndCount({
      where: { community: options.community, isDeleted: false },
    });

    const allInvitesGrouped = _.groupBy(allInvites[0], 'inviteAccepted');

    return {
      all: allInvites[1],
      pending: allInvitesGrouped['false']
        ? allInvitesGrouped['false'].length
        : 0,
      accepted: allInvitesGrouped['true']
        ? allInvitesGrouped['true'].length
        : 0,
    };
  }

  /**
   * Resets the given invite.
   * @param inviteId Invite's Id to reset.
   * @param communityId Community Id of the invite.
   */
  async resetInvite(
    inviteId,
    communityId,
    originUrl,
  ): Promise<{ status: boolean; msg: string; inviteId: string }> {
    const response = await this.getOneInvite({
      where: { id: inviteId, isDeleted: false },
    });
    if (!response) {
      return { inviteId: inviteId, status: false, msg: 'Invite Not Found' };
    }
    if (response.inviteAccepted) {
      const existingUser = await this.userService.getUsers({
        where: { email: response.email },
      });
      response['existingUser'] = existingUser[0];
      return {
        inviteId: inviteId,
        status: false,
        msg: 'User Alredy Registered',
      };
    } else {
      const inviteCode = bcrypt
        .hashSync(response.email, 10)
        .replace(/[\/,?]/g, '');
      try {
        const communityData = await this.communityService.getOneCommunity({
          where: { id: communityId },
        });
        await this.addInviteEmail({
          code: inviteCode,
          to: response.email,
          url: originUrl,
          isSSO: response.isSSO,
          community: communityData,
        });
        await this.updateInvite(
          { id: response.id },
          {
            inviteCode: inviteCode,
            statusCode: InviteStatus.SENT,
            expiryDate: moment().add(1, 'days'),
          },
        );
      } catch (error) {
        await this.updateInvite(
          { id: response.id },
          {
            inviteCode: inviteCode,
            statusCode: InviteStatus.NOTSENT,
            expiryDate: moment().add(1, 'days'),
          },
        );
      }

      return {
        inviteId: inviteId,
        status: true,
        msg: 'Invites Reset Successfully',
      };
    }
  }

  /**
   * Get invites
   */
  async getInvites(options: {}): Promise<InviteEntity[]> {
    return this.inviteRepository.find(options);
  }

  /**
   * Get invites with filters
   */
  async getInvitesWithFilters(options: {
    community: number;
    inviteAccepted: boolean;
    group?: number;
  }): Promise<InviteEntity[]> {
    const query = this.inviteRepository
      .createQueryBuilder('invite')
      .where('invite.community = :community', { community: options.community })
      .andWhere('invite.inviteAccepted = :inviteAccepted', {
        inviteAccepted: options.inviteAccepted,
      });

    if (options.group) {
      query.andWhere('invite.circles @> ARRAY[:group]', {
        group: options.group,
      });
    }

    return query.getMany();
  }

  /**
   * Get invites
   */
  async getInvitesAndCount(options: {}): Promise<[InviteEntity[], number]> {
    return this.inviteRepository.findAndCount(options);
  }

  /**
   * Get One invites
   */
  async getOneInvite(options: {}): Promise<InviteEntity> {
    return this.inviteRepository.findOne(options);
  }

  async getInvitesByCommunity(
    communityId: number,
    originUrl?,
    filters?: {},
  ): Promise<{ invites: InviteEntity[]; count: number }> {
    const configService = new ConfigService();
    let originUrlParam: string;
    if (originUrl) {
      originUrlParam = originUrl;
    } else {
      originUrlParam = configService.get('CLIENT_URL');
    }

    const invites = await this.getInvitesAndCount({
      where: {
        community: communityId,
        isDeleted: false,
        ...(filters &&
          filters['inviteAccepted'] && {
            inviteAccepted: filters['inviteAccepted'],
          }),
      },
      relations: ['role'],
      order: {
        id: 'DESC',
      },
    });

    const invitesData = { invites: invites[0], count: invites[1] };

    if (invitesData.invites.length) {
      const newArray = _.map(invitesData.invites, 'email');
      const [users, allGroups] = await Promise.all([
        this.userService.getUsers({ where: { email: In(newArray) } }),
        this.circleService.getCircles({ where: { community: communityId } }),
      ]);

      const allGroupsGrouped = _.groupBy(allGroups, 'id');

      invitesData.invites.forEach((invite, index) => {
        invite['inviteUrl'] = UtilsService.generateInviteUrl(
          originUrlParam,
          invite.inviteCode, // same as invite code
        );
        const foundIndex = _.findIndex(users, function(o) {
          return o.email == invite.email;
        });
        if (foundIndex != -1) {
          invite[
            'userName'
          ] = `${users[foundIndex].firstName} ${users[foundIndex].lastName}`;
          invite['email'] = users[foundIndex].email;
        } else {
          invite['userName'] = '--';
        }

        invite['groups'] = invite.circles
          ? invite.circles.map(groupId => _.head(allGroupsGrouped[groupId]))
          : [];

        if (filters && filters['searchText']) {
          const searchRegex = new RegExp(`.*${filters['searchText']}.*`, 'gi');
          if (
            !invite.email.match(searchRegex) &&
            !invite.name.match(searchRegex) &&
            !invite['userName'].match(searchRegex)
          ) {
            delete invitesData.invites[index];
            invitesData.count--;
          }
        }
      });
      invitesData.invites = _.compact(invitesData.invites);

      if (filters && filters['take']) {
        invitesData.invites = invitesData.invites.slice(
          filters['skip'] || 0,
          (filters['skip'] || 0) + filters['take'],
        );
      }
    }

    return invitesData;
  }

  async getInvitesByCircle(
    take,
    skip,
    circleId,
    searchKeys: { email: string; isDeleted?: boolean },
  ): Promise<{}> {
    const query = this.inviteRepository
      .createQueryBuilder('invite')
      .where(':circles = ANY (invite.circles)', {
        circles: circleId,
      })
      .andWhere('invite.inviteAccepted = :inviteAccepted', {
        inviteAccepted: false,
      })
      .andWhere(
        new Brackets(qb => {
          if (searchKeys.email) {
            qb.orWhere('LOWER(invite.email) like :userName', {
              userName: `%${searchKeys.email.toLowerCase()}%`,
            });
          }
          if (!searchKeys.email) {
            qb.orWhere('1 = :trueCase', {
              trueCase: 1,
            });
          }
        }),
      );

    if (searchKeys.hasOwnProperty('isDeleted')) {
      query.andWhere('invite.isDeleted = :isDeleted', {
        isDeleted: searchKeys.isDeleted,
      });
    }

    return query
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }
  async getInvitesByCircleCount(circleId): Promise<{}> {
    return this.inviteRepository
      .createQueryBuilder('invite')
      .where(':circles = ANY (invite.circles)', {
        circles: circleId,
      })
      .andWhere('invite.inviteAccepted = :inviteAccepted', {
        inviteAccepted: false,
      })
      .andWhere('invite.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .getCount();
  }
  async searchInvitesByCommunity(
    take,
    skip,
    communityId,
    searchKeys: { email: string },
  ): Promise<{}> {
    return this.inviteRepository
      .createQueryBuilder('invite')
      .where(':community = invite.community', {
        community: communityId,
      })
      .andWhere('invite.inviteAccepted = :inviteAccepted', {
        inviteAccepted: false,
      })
      .andWhere(
        new Brackets(qb => {
          if (searchKeys.email) {
            qb.orWhere('LOWER(invite.email) like :userName', {
              userName: `%${searchKeys.email.toLowerCase()}%`,
            });
          }
          if (!searchKeys.email) {
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
  async getInvitesByCommunityCount(communityId): Promise<{}> {
    return this.inviteRepository
      .createQueryBuilder('invite')
      .where(':community = invite.community', {
        community: communityId,
      })
      .andWhere('invite.inviteAccepted = :inviteAccepted', {
        inviteAccepted: false,
      })
      .andWhere('invite.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .getCount();
  }
  /**
   * Add invite
   */
  async addInvite(data: {}): Promise<any> {
    const inviteCreated = this.inviteRepository.create(data);
    return this.inviteRepository.save(inviteCreated);
  }
  /**
   * Add invite
   */
  async addInviteEmail(_data: {
    code;
    to: string;
    url;
    isSSO;
    community;
  }): Promise<any> {
    const defaultEmailTemplate = _.head(
      await this.client
        .send('getDefaultEmailTemplates', { name: 'Default Email Template' })
        .toPromise(),
    );
    const inviteEmailTemplate = _.head(
      await this.client
        .send('getEmailTemplateForCommunity', {
          name: 'Invite User',
          community: _data.community.id,
        })
        .toPromise(),
    );
    inviteEmailTemplate['body'] = inviteEmailTemplate['body'].replace(
      '{{linkButton}}',
      UtilsService.generateInviteUrlButton(_data.url, _data.code, _data.isSSO),
    );
    inviteEmailTemplate['body'] = inviteEmailTemplate['body'].replace(
      '{{companyName}}',
      _data.community.name,
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{tagLine}}',
      '',
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{companyName}}',
      _data.community.name,
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{featureImage}}',
      inviteEmailTemplate['featureImage'],
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{body}}',
      inviteEmailTemplate['body'],
    );
    defaultEmailTemplate['body'] = defaultEmailTemplate['body'].replace(
      '{{ subject }}',
      inviteEmailTemplate['subject'],
    );
    return this.client
      .send('addSendEmailsData', {
        to: _data.to,
        from: inviteEmailTemplate['senderEmail'],
        emailContent: defaultEmailTemplate['body'],
        status: 'pending',
        community: _data.community.id,
        subject: inviteEmailTemplate['subject'],
      })
      .toPromise();
  }

  /**
   * Update invite
   */
  async updateInvite(options: {}, data: {}): Promise<{}> {
    return this.inviteRepository.update(options, data);
  }

  /**
   * Delete invite
   */
  async deleteInvite(options: {}): Promise<{}> {
    return this.inviteRepository.delete(options);
  }
}
