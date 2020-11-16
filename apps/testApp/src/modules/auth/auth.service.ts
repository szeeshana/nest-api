import { JwtService } from '@nestjs/jwt';
import { Injectable, ForbiddenException } from '@nestjs/common';

import { ConfigService } from '../../shared/services/config.service';
import { UserEntity } from '../../modules/user/user.entity';
import { UserLoginDto } from '../../modules/user/dto/UserLoginDto';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { InvitePendingException } from '../../exceptions/invite-pending.exception';
import { InvalidPasswordException } from '../../exceptions/invalid-password.exception';
import { UtilsService } from '../../providers/utils.service';
import { UserService } from '../../modules/user/user.service';
import { InviteService } from '../../modules/invite/invite.service';
import { ContextService } from '../../providers/context.service';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import { In, getRepository, Like } from 'typeorm';
import { TagService } from '../../modules/tag/tag.service';
import { IntegrationService } from '../../modules/integration/integration.service';
import { parse } from 'tldts';
import { UserCommCommunities } from '../../modules/user/userCommunityCommunities.entity';
import { CommunityService } from '../../modules/community/community.service';

// import * as moment from 'moment';

@Injectable()
export class AuthService {
  private static _authUserKey = 'user_key';
  static configService: any;

  constructor(
    public readonly jwtService: JwtService,
    public readonly configService: ConfigService,
    public readonly userService: UserService,
    public readonly inviteService: InviteService,
    public readonly tagService: TagService,
    public readonly integrationService: IntegrationService,
    public readonly communityService: CommunityService,
  ) {}

  async createToken(
    user,
    community?,
    setInDb = true,
  ): Promise<TokenPayloadDto> {
    let data = {
      id: _.head(user)['id'],
      currentCommunity: _.head(user)['currentCommunity'].id,
    };

    if (!_.isEmpty(community)) {
      data = { ...data, ...{ community: community } };
    }
    const accessToken = await this.jwtService.signAsync(data);

    const refreshToken = await this.jwtService.signAsync(data, {
      expiresIn: this.configService.getNumber('REFRESH_TOKEN_EXPIRATION_TIME'),
    });
    if (setInDb) {
      await this.userService.updateUser(
        { id: _.head(user)['id'] },
        { refreshToken: refreshToken },
        '',
        false,
      );
    }
    const userCommunities = getRepository(UserCommCommunities);
    const updateUserCommunityToken = userCommunities.update(
      {
        userId: _.head(user)['id'],
        communityId: _.head(user)['currentCommunity'].id,
      },
      { token: accessToken },
    );
    await Promise.all([updateUserCommunityToken]);

    return new TokenPayloadDto({
      fullToken: accessToken,
      refreshToken: refreshToken,
      currentCommunityObj: _.head(user)['currentCommunity'],
    });
  }

  async accessToken(params: {
    clientId: string;
    clientSecret;
  }): Promise<TokenPayloadDto> {
    const data = {
      id: params.clientId,
      secret: params.clientSecret,
    };
    const accessToken = await this.jwtService.signAsync(data);
    const refreshToken = await this.jwtService.signAsync(data, {
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION_TIME'),
    });
    return new TokenPayloadDto({
      fullToken: accessToken,
      refreshToken: refreshToken,
    });
  }

  async validateUser(
    userLoginDto: UserLoginDto,
    communityUrl,
  ): Promise<{ loginType: string; data: UserEntity[]; appData?: {} }> {
    const user = await this.userService.getUsers({
      select: ['email', 'password'],
      where: {
        email: userLoginDto.email,
      },
    });
    let isPasswordValid = false;
    if (user.length) {
      isPasswordValid = await UtilsService.validateHash(
        userLoginDto.password,
        user && _.head(user).password,
      );
    }

    if (user.length === 0) {
      const invite = await this.inviteService.getInvites({
        where: {
          email: userLoginDto.email,
        },
      });
      if (invite.length === 0) {
        throw new UserNotFoundException();
      } else {
        throw new InvitePendingException();
      }
    } else if (!isPasswordValid) {
      throw new InvalidPasswordException();
    }
    const userFullData = _.head(
      await this.userService.getUsers({
        relations: [
          'userCommunities',
          'userCommunities.community',
          'opportunities',
          'opportunities.opportunityType',
          'profileImage',
        ],
        where: {
          email: userLoginDto.email,
        },
      }),
    );
    const communityFindResult: {} = this.findUserCommunity(
      userFullData.userCommunities,
      communityUrl,
    );
    const inComingUrl = `${
      parse(communityUrl).subdomain ? parse(communityUrl).subdomain + '.' : ''
    }${parse(communityUrl).domain}`;
    const options = {
      where: {
        url: Like(`%${inComingUrl}%`),
      },
    };
    // new check added
    const data = await this.communityService.getCommunities(options);

    const foundDomain = _.find(data, function(o) {
      return (
        `${parse(o.url).subdomain ? parse(o.url).subdomain + '.' : ''}${
          parse(o.url).domain
        }` === inComingUrl
      );
    });
    // new check added
    if (
      (!communityFindResult && !_.isEmpty(foundDomain)) ||
      !userFullData.userCommunities.length
    ) {
      throw new UserNotFoundException();
    }

    await this.userService.updateUser(
      { id: userFullData.id },
      { lastLogin: new Date() },
      '',
      false,
    );
    if (userFullData.skills && userFullData.skills.length) {
      userFullData['skillsData'] = await this.tagService.getTags({
        where: { id: In(userFullData.skills) },
      });
    }
    userFullData['communities'] = UtilsService.updateUserCommunityData(
      userFullData.userCommunities,
    );
    // delete userFullData.userCommunities;

    if (userFullData.opportunities && userFullData.opportunities.length) {
      userFullData[
        'draftOpportunities'
      ] = UtilsService.getUserDraftOpportunityCount(userFullData.opportunities);
      delete userFullData.opportunities;
    }
    if (userLoginDto.clientId) {
      //   return {
      //     loginType: 'app',
      //     data: userFullData,
      //     appData: {
      //       code: '',
      //       redirectUri: userLoginDto.redirectUri,
      //       state: userLoginDto.state,
      //       community: dataClient[0].community.id,
      //     },
      //   };
      const dataClient = await this.integrationService.getIntegrations({
        where: {
          clientId: userLoginDto.clientId,
          redirectUri: userLoginDto.redirectUri,
        },
        relations: ['community'],
      });
      const userCommunitieIds = _.map(
        _.map(userFullData.userCommunities, 'community'),
        'id',
      );
      if (
        dataClient.length &&
        _.indexOf(userCommunitieIds, _.head(dataClient).community.id) > -1
      ) {
        return {
          loginType: 'app',
          data: [userFullData],
          appData: {
            code: '',
            redirectUri: userLoginDto.redirectUri,
            state: userLoginDto.state,
            community: _.head(dataClient).community,
          },
        };
      } else {
        throw new UserNotFoundException();
      }
    }

    /**
     * Updating Object Structure for front end
     */

    if (communityFindResult) {
      if (communityFindResult['isDeleted']) {
        throw new ForbiddenException('Forbidden Access !');
      }
      userFullData['currentCommunity'] = communityFindResult['community'];
    } else {
      const validCommunities = this.findAnyValidCommunity(
        userFullData.userCommunities,
      );
      if (validCommunities && validCommunities.length) {
        userFullData['currentCommunity'] = _.head(validCommunities).community;
      } else {
        throw new ForbiddenException('Forbidden Access !');
      }
    }
    return { loginType: 'user', data: [userFullData] };
  }

  static setAuthUser(user: UserEntity): void {
    ContextService.set(AuthService._authUserKey, user);
  }

  static getAuthUser(): UserEntity {
    return ContextService.get(AuthService._authUserKey);
  }
  findUserCommunity(userCommunitiesObject, communityUrl): {} {
    const matchedCommunity = _.find(userCommunitiesObject, function(o) {
      return parse(o.community.url).hostname === parse(communityUrl).hostname;
    });
    return matchedCommunity;
  }

  /**
   * Verify & Decode Token
   */
  async verifyToken(token) {
    const res = jwt.verify(
      token.toString().trim(),
      this.configService.get('JWT_SECRET_KEY'),
      res => {
        return res == null ? jwt.decode(token.toString().trim()) : 'expired';
      },
    );
    return res;
  }

  /**
   * Returns the decoded payload without verifying if the signature is valid.
   * @param token JWT Token to decode.
   * @returns The decoded token.
   */
  decodeToken(token: string): {} {
    return jwt.decode(token.toString().trim());
  }

  findAnyValidCommunity(
    communities: UserCommCommunities[],
  ): UserCommCommunities[] {
    const foundCommunities = [];
    _.map(communities, val => {
      if (!val.isDeleted) {
        foundCommunities.push(val);
      }
    });
    return foundCommunities;
  }
}
