import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { lookup } from 'geoip-lite';
import * as _ from 'lodash';
import * as moment from 'moment';
import { getConnection } from 'typeorm';

import { DEMO_IPS, TABLES } from '../common/constants/constants';
import { ConfigService } from '../shared/services/config.service';

const config = new ConfigService();

export class UtilsService {
  /**
   * convert entity to dto class instance
   * @param {{new(entity: E, options: any): T}} model
   * @param {E[] | E} entity
   * @param options
   * @returns {T[] | T}
   */
  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E,
    options?: any,
  ): T;
  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E[],
    options?: any,
  ): T[];
  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E | E[],
    options?: any,
  ): T | T[] {
    if (_.isArray(entity)) {
      return entity.map(u => new model(u, options));
    }

    return new model(entity, options);
  }

  /**
   * generate hash from password or string
   * @param {string} password
   * @returns {string}
   */
  static generateHash(password: string): string {
    return bcrypt.hashSync(password, config.getNumber('BCRYPT_WORK') || 12);
  }

  /**
   * generate random string
   * @param length
   */
  static generateRandomString(length: number): string {
    return Math.random()
      .toString(36)
      .replace(/[^a-zA-Z0-9]+/g, '')
      .substr(0, length);
  }
  /**
   * validate text with hash
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  static validateHash(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash || '');
  }

  // FIXME: remove after typescript 3.7 update
  static get<B, C = undefined>(
    func: () => B,
    defaultValue?: C,
  ): B | C | undefined {
    try {
      const value = func();

      if (_.isUndefined(value)) {
        return defaultValue;
      }
      return value;
    } catch {
      return defaultValue;
    }
  }

  static generateInviteUrl(originUrl, inviteId): string {
    return `${originUrl}/community/accept/invite/${inviteId}`;
  }
  static generateOpportunityUrl(originUrl, opportunityId): string {
    return `${originUrl}/idea/${opportunityId}?tab=moreInfo`;
  }
  static generateInviteUrlButton(originUrl, inviteId, isSSO): string {
    let url;
    if (!isSSO) {
      url = `${originUrl}/community/accept/invite/${inviteId}`;
    } else {
      url = originUrl;
    }
    return `<tr>
    <td align="left" style="color:#455a64;padding:20px 36px 26px">
      <a href="${url}" style="width: 312px; height: 36px; font-size:16px; line-height:36px; background:#1ab394;text-decoration:none;border-radius:4px;color:#fff;font-weight:700; text-transform: uppercase; padding:10px 20px;display:inline-block;margin-bottom:0;font-weight:normal;text-align:center;vertical-align:middle;margin-top:15px;">Accept Invite</a>
    </td>
  </tr>`;
  }
  static generateResetPasswordUrlButton(originUrl, resetCOde): string {
    return `<tr>
    <td align="left" style="color:#455a64;">
      <a href="${originUrl}/settings/update-password/${resetCOde}" style="width: 312px; height: 36px; font-size:16px; line-height:36px; background:#1ab394;text-decoration:none;border-radius:4px;color:#fff;font-weight:700; text-transform: uppercase; padding:10px 20px;display:inline-block;margin-bottom:0;font-weight:normal;text-align:center;vertical-align:middle;margin-top:15px;">Reset Password</a>
    </td>
  </tr>`;
  }

  static generatePasswordResetUrl(originUrl, resetCOde): string {
    return `${originUrl}/settings/update-password/${resetCOde}`;
  }

  static getCommunitySignupRate(invites): number {
    // const pending = _.filter(invites, function(o) {
    //   return o.invite_accepted === false;
    // });
    if (invites.length) {
      const accepted = _.filter(invites, function(o) {
        return o.invite_accepted === true;
      });
      const total = invites.length;
      return parseFloat(((accepted.length / total) * 100).toFixed(2));
    } else {
      return 0;
    }
  }
  static async createUserName(firstName, lastName, community) {
    const communityData = await getConnection()
      .createQueryBuilder()
      .select(`community`)
      .from(`${TABLES.COMMUNITY}`, `community`)
      .leftJoinAndSelect('community.tenant', 'tenant')
      .getMany();
    const tenantData = await communityData[0]['tenant'];
    const allTenantCommunities = await getConnection()
      .createQueryBuilder()
      .select(`community.id`)
      .from(`${TABLES.COMMUNITY}`, `community`)
      .where(`community.tenant = :tenant`, {
        tenant: tenantData.id,
      })
      .getMany();

    const communityUsers = await getConnection()
      .createQueryBuilder()
      .select('user', 'userCommunities')
      .from(`${TABLES.USER}`, `user`)
      .leftJoinAndSelect('user.userCommunities', 'userCommunities')
      .where('userCommunities.community IN (:...community)', {
        community: _.map(allTenantCommunities, 'id'),
      })
      .andWhere('user.userName = :userName', {
        userName: firstName + lastName,
      })
      .getMany();
    if (communityUsers.length) {
      const newLastName = lastName + Math.floor(Math.random() * (10 - 1) + 1);
      return await this.createUserName(firstName, newLastName, community);
    } else {
      return firstName + lastName;
    }
  }
  static updateKey(paramArray, keyToUpdate, updatedKey) {
    if (!paramArray.length) {
      return [];
    }
    const updatedArray = [];

    paramArray.map(item => {
      updatedArray.push(
        _.mapKeys(item, (_value, key) => {
          let newKey = key;
          if (key === keyToUpdate) {
            newKey = updatedKey;
          }
          return newKey;
        }),
      );
    });
    return updatedArray;
  }

  static updateUserCommunityData(userCommunities) {
    const userCommunitiesTemp = [];
    for (const i of userCommunities) {
      i.community['communityRole'] = {
        userId: i.userId,
        communityId: i.communityId,
      };
      userCommunitiesTemp.push(i.community);
    }
    return userCommunitiesTemp;
  }
  static getUserDraftOpportunityCount(opportunities) {
    const draftOpportunities = _.filter(opportunities, function(o) {
      return o.draft === true && o.isDeleted === false;
    }).length;
    return draftOpportunities;
  }

  static async getUserAvatar(firstName, lastName, size, background, color) {
    try {
      const imageResponse = await axios({
        url: `https://ui-avatars.com/api/?rounded=true&name=${firstName}+${lastName}&size=${size}&background=${background}&color=${color}`,
        method: 'GET',
        responseType: 'arraybuffer',
      });
      return imageResponse.data;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Updates the permission according to the given scenario condition.
   * @param permToCheck Permission to check the condition on.
   * @param condition Condition on the basis of which permission has to be updated.
   * @returns Updated permission value.
   */
  static checkScenarioPermission(permToCheck, condition): number {
    if (permToCheck === 1) {
      return condition ? 2 : 0;
    }
    return permToCheck;
  }

  static getUserLocationByIp(ip) {
    const ipScenario = config.get('RANDOM_IP_FOR_TEST');
    const geo = lookup(ip);
    if (geo !== null) {
      return {
        country: geo && geo.country ? geo.country : null,
        city: geo && geo.city ? geo.city : null,
        timeZone: geo && geo.timezone ? geo.timezone : null,
        region: geo && geo.region ? geo.region : null,
        latLng: geo && geo.ll ? geo.ll : null,
      };
    } else {
      if (ipScenario === 'on') {
        const tempIp = DEMO_IPS[Math.floor(Math.random() * DEMO_IPS.length)];
        const geoTesting = lookup(tempIp);
        return {
          country: geoTesting && geoTesting.country ? geoTesting.country : null,
          city: geoTesting && geoTesting.city ? geoTesting.city : null,
          timeZone:
            geoTesting && geoTesting.timezone ? geoTesting.timezone : null,
          region: geoTesting && geoTesting.region ? geoTesting.region : null,
          latLng: geoTesting && geoTesting.ll ? geoTesting.ll : null,
        };
      }
      return null;
    }
  }
  static getLastThirtyDates(numberOnMonths) {
    // Get moment at start date of previous month
    const prevMonth = moment().subtract(numberOnMonths, 'month');
    const prevMonthDays = prevMonth.daysInMonth() * numberOnMonths;

    // Array to collect dates of previous month
    const prevMonthDates = [];
    for (let i = 0; i < prevMonthDays; i++) {
      const prevMonthDay = prevMonth
        .clone()
        .add(i, 'days')
        .format('YYYY-MM-DD');
      prevMonthDates.push(prevMonthDay);
    }
    return prevMonthDates;
  }
}
