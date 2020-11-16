import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpStatus,
  UseGuards,
  Get,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  Param,
} from '@nestjs/common';

// import { ResponseFormatService } from '../services/response-format.service';
// import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { UserLoginDto } from './dto/UserLoginDto';
import { Request, Response } from 'express';
import { UserService } from '../../modules/user/user.service';
import { AuthService } from './auth.service';
import { ConfigService } from '../../shared/services/config.service';
import { UtilsService } from '../../providers/utils.service';
import {
  USER_AVATAR,
  ACTION_TYPES,
  ENTITY_TYPES,
} from '../../common/constants/constants';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { parse } from 'tldts';
import { InviteService } from '../../modules/invite/invite.service';
import { UserAttachmentService } from '../../modules/userAttachment/userAttachment.service';
import { RoleActorsService } from '../../modules/roleActors/roleActors.service';
import { RoleActorTypes, UserRole } from '../../enum';
import { In, getConnection, getRepository } from 'typeorm';
import { UserRegisterDto } from './dto/UserRegisterDto';
import { CommunityRegisterDto } from './dto/CommunityRegisterDto';
import { UserAcceptInviteDto } from './dto/UserAcceptInviteDto';
import { LoginPayloadDto } from './dto/LoginPayloadDto';
import { UserResetPassDto } from './dto/UserResetPassDto';
import { AccessTokenDto } from './dto/AccessTokenDto';
import { RefreshTokenBodyDto } from './dto/RefreshTokenBodyDto';
import { TenantService } from '../../modules/tenant/tenant.service';
import { CommunityService } from '../../modules/community/community.service';
import { lookup } from 'geoip-lite';
import { RoleService } from '../../modules/role/role.service';
import { RoleLevelEnum } from '../../enum/role-level.enum';
import { RolesEnum } from '../../enum/roles.enum';
import { UserCircles } from '../../modules/user/user.circles.entity';
import { CommunityActionPoints } from '../../shared/services/communityActionPoint.service';
import { InviteGateway } from '../../modules/invite/invite.gateway';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse } from '@nestjs/swagger';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { PasswordResetService } from '../../modules/password/password-reset.service';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { TagService } from '../../modules/tag/tag.service';
import * as _ from 'lodash';
import { IntegrationService } from '../../modules/integration/integration.service';
import * as jwt from 'jsonwebtoken';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import { InviteEntity } from '../invite/invite.entity';
import { SamlObject } from '../../interfaces';
import { UserEntity } from '../user/user.entity';
import { ElasticSearchService } from '../../shared/services/elasticSearchHook';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    public readonly authService: AuthService,
    private readonly awsS3Service: AwsS3Service,
    public readonly inviteService: InviteService,
    public readonly userAttachmentService: UserAttachmentService,
    public readonly roleActorService: RoleActorsService,
    public readonly tenantService: TenantService,
    public readonly communityService: CommunityService,
    public readonly roleService: RoleService,
    public readonly inviteGateway: InviteGateway,
    public readonly passwordResetService: PasswordResetService,
    public readonly tagService: TagService,
    private readonly integrationService: IntegrationService,
    private readonly elasticSearchService: ElasticSearchService,
  ) {}
  private configService = new ConfigService();
  private cookieSameSiteDefault = 'Lax';
  @Post('user-login')
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    userLoginDto.email = userLoginDto.email.toLowerCase();
    const userEntity = await this.authService.validateUser(
      userLoginDto,
      req.headers.origin,
    );

    const originUrl = parse(req.headers.origin.toString());

    const urlCommunity = originUrl.subdomain
      ? originUrl.subdomain
      : originUrl.domainWithoutSuffix;
    let token: TokenPayloadDto;

    if (userEntity.loginType === 'app') {
      userEntity.data[0]['currentCommunity'] = userEntity.appData['community'];
      token = await this.authService.createToken(userEntity.data);

      userEntity.appData['code'] = token.fullToken;
      res.cookie(`${urlCommunity}`, token.fullToken, {
        httpOnly: true,
        sameSite:
          this.configService.get('COOKIE_SAME_SITE') ||
          this.cookieSameSiteDefault,
      });
      res.cookie('refresh-token', token.refreshToken, {
        httpOnly: true,
        sameSite:
          this.configService.get('COOKIE_SAME_SITE') ||
          this.cookieSameSiteDefault,
      });

      res.send({
        statusCode: HttpStatus.OK,
        wasSuccess: true,
        message: 'User Logged In Successfully',
        response: {
          user: userEntity.data[0],
          loginStatus: true,
          appLoginStatus: true,
          appLoginData: userEntity.appData,
        },
      });
    } else {
      token = await this.authService.createToken(userEntity.data);

      if (!userEntity.data[0].profileImage) {
        /* Add User Avatar */
        const content = await UtilsService.getUserAvatar(
          userEntity.data[0].firstName,
          userEntity.data[0].lastName,
          USER_AVATAR.size,
          USER_AVATAR.background,
          USER_AVATAR.color,
        );
        const avatarUrl = await this.awsS3Service.uploadImage(
          {
            buffer: content,
            mimetype: USER_AVATAR.mimeType,
          },
          USER_AVATAR.bucketPath,
        );
        const userAttachmentResponse = await this.userAttachmentService.addUserAttachment(
          {
            user: userEntity.data[0].id,
            attachmentType: USER_AVATAR.type,
            url: avatarUrl,
            community: userEntity.data[0].userCommunities[0].community.id,
          },
        );
        await this.userService.updateUser(
          { id: userEntity.data[0].id },
          {
            profileImage: userAttachmentResponse.id,
          },
          '',
          false,
        );
        userEntity.data[0].profileImage = userAttachmentResponse;
        /* Add User Avatar */
      }
      if (!userEntity.data[0].region) {
        const ip = req.clientIp;
        const userUpdatedObjectForLocation = UtilsService.getUserLocationByIp(
          ip,
        );
        if (userUpdatedObjectForLocation !== null) {
          await this.userService.updateUser(
            { id: userEntity.data[0].id },
            userUpdatedObjectForLocation,
            token.currentCommunityObj['id'],
            true,
          );
        }
      }
      if (Array.isArray(userEntity.data) && userEntity.data.length) {
        const nonAcceptedInvites = await this.inviteService.getInvites({
          relations: ['community'],
          where: { email: userEntity.data[0].email, inviteAccepted: false },
        });
        userEntity.data[0]['invites'] = nonAcceptedInvites;

        userEntity.data[0]['roles'] = await this.roleActorService.getRoleActors(
          {
            where: {
              entityObjectId: null,
              entityType: null,
              actorId: userEntity.data[0].id,
              actionType: RoleActorTypes.USER,
              community: In(
                userEntity.data[0].userCommunities.map(
                  userCommunity => userCommunity.communityId,
                ),
              ),
            },
            relations: ['role'],
          },
        );
      }

      res.cookie(`${urlCommunity}`, token.fullToken, {
        httpOnly: true,
        sameSite:
          this.configService.get('COOKIE_SAME_SITE') ||
          this.cookieSameSiteDefault,
      });
      res.cookie('refresh-token', token.refreshToken, {
        httpOnly: true,
        sameSite:
          this.configService.get('COOKIE_SAME_SITE') ||
          this.cookieSameSiteDefault,
      });

      res.send({
        statusCode: HttpStatus.OK,
        wasSuccess: true,
        message: 'User Logged In Successfully',
        response: {
          user: userEntity.data[0],
          loginStatus: true,
        },
      });
    }
  }
  @Post('user-register')
  async tenantRegister(
    @Res() res: Response,
    @Req() req: Request,
    @Body('user') userData: UserRegisterDto,
    @Body('community') communityData: CommunityRegisterDto,
  ): Promise<void> {
    try {
      const originUrl = parse(req.headers.origin.toString());

      const urlCommunity = originUrl.subdomain
        ? originUrl.subdomain
        : originUrl.domainWithoutSuffix;
      userData.email = userData.email.toLowerCase();

      userData.isDeleted = false;
      userData.userName = userData.firstName + userData.lastName;
      const userResponse = await this.userService.addUser(userData);

      const tenantResponse = await this.tenantService.addTenant({
        name: userData.userName,
        email: userData.email,
        createdBy: userResponse.id,
        updatedBy: userResponse.id,
        isDeleted: false,
        ownerUser: userResponse,
      });
      const communityDataUpdated = {
        ...communityData,
        createdBy: userResponse.id,
        updatedBy: userResponse.id,
        tenant: tenantResponse,
        ownerUser: userResponse,
        isDeleted: false,
      };
      const communityResponse = await this.communityService.addCommunity(
        communityDataUpdated,
      );
      /* Add User Avatar */
      const content = await UtilsService.getUserAvatar(
        userResponse.firstName,
        userResponse.lastName,
        USER_AVATAR.size,
        USER_AVATAR.background,
        USER_AVATAR.color,
      );
      const avatarUrl = await this.awsS3Service.uploadImage(
        {
          buffer: content,
          mimetype: USER_AVATAR.mimeType,
        },
        USER_AVATAR.bucketPath,
      );
      const userAttachmentResponse = await this.userAttachmentService.addUserAttachment(
        {
          user: userResponse.id,
          attachmentType: USER_AVATAR.type,
          url: avatarUrl,
          community: communityResponse.id,
        },
      );
      await this.userService.updateUser(
        { id: userResponse.id },
        {
          profileImage: userAttachmentResponse.id,
        },
        '',
        false,
      );
      if (!userResponse.region) {
        const ip = req.clientIp;
        const geo = lookup(ip);
        if (geo !== null) {
          await this.userService.updateUser(
            { id: userResponse.id },
            {
              country: geo && geo.country ? geo.country : null,
              city: geo && geo.city ? geo.city : null,
              timeZone: geo && geo.timezone ? geo.timezone : null,
              region: geo && geo.region ? geo.region : null,
              latLng: geo && geo.ll ? geo.ll : null,
            },
            communityResponse.id,
            true,
          );
        }
      }
      /* End Add User Avatar */

      // assign required role
      const role = (await this.roleService.getRoles({
        where: {
          level: RoleLevelEnum.community,
          community: communityResponse.id,
          title: RolesEnum.admin,
        },
      }))[0];

      await this.roleActorService.addRoleActors({
        role,
        actorType: RoleActorTypes.USER,
        actorId: userResponse.id,
        entityObjectId: null,
        entityType: null,
        community: communityResponse.id,
      });

      await getConnection()
        .query(`INSERT INTO public.user_communities_community(
      user_id, community_id)
      VALUES ('${userResponse.id}', '${communityResponse.id}')`);
      const createdUserData = await this.userService.getUsers({
        relations: [
          'userCommunities',
          'userCommunities.community',
          'opportunities',
          'opportunities.opportunityType',
          'profileImage',
        ],
        where: { id: userResponse.id },
      });
      const userDataForElasticSearch = await this.userService.getOneUser({
        where: { id: userResponse.id },
      });
      userDataForElasticSearch['communityId'] = communityResponse.id;

      this.elasticSearchService.addUserData(userDataForElasticSearch);
      userResponse['currentCommunity'] =
        createdUserData[0].userCommunities[0].community;
      createdUserData[0]['currentCommunity'] =
        createdUserData[0].userCommunities[0].community;
      const token = await this.authService.createToken([userResponse]);
      delete userResponse.password;
      res.cookie(`${urlCommunity}`, token.fullToken, {
        httpOnly: true,
        sameSite:
          this.configService.get('COOKIE_SAME_SITE') ||
          this.cookieSameSiteDefault,
      });
      res.cookie('refresh-token', token.refreshToken, {
        httpOnly: true,
        sameSite:
          this.configService.get('COOKIE_SAME_SITE') ||
          this.cookieSameSiteDefault,
      });
      res.send({
        statusCode: HttpStatus.OK,
        wasSuccess: true,
        message: 'Tenant Registered',
        response: {
          user: createdUserData[0],
          community: communityResponse,
          tenant: tenantResponse,
          loginStatus: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }
  @Post('accept-invite')
  async userRegister(
    @Res() res: Response,
    @Req() req: Request,
    @Body('user') userData: UserAcceptInviteDto,
    @Body('inviteCode') inviteCode: string,
  ): Promise<void> {
    try {
      userData.email = userData.email.toLowerCase();
      const originUrl = parse(req.headers.origin.toString());

      const urlCommunity = originUrl.subdomain
        ? originUrl.subdomain
        : originUrl.domainWithoutSuffix;
      const inviteData = await this.inviteService.getInvites({
        where: { id: inviteCode },
        relations: ['community', 'role', 'user'],
      });
      if (inviteData.length) {
        const communityData = inviteData[0].community;

        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // Only check is removed . in future If we need to on the expiry , only uncommment this code

        // if (moment().isAfter(moment(inviteData[0].expiryDate))) {
        //   res.send({
        //     statusCode: HttpStatus.OK,
        //     wasSuccess: true,
        //     message: 'Invitation Expired',
        //     response: {
        //       loginStatus: false,
        //     },
        //   });
        // }

        ///////////////////////////////////////////////////////////////////////////////////////////////////

        userData.isDeleted = false;
        const userRelations = [
          'userCommunities',
          'userCommunities.community',
          'opportunities',
          'opportunities.opportunityType',
          'profileImage',
        ];
        const userExists = await this.userService.getUsers({
          where: { email: userData.email },
          relations: userRelations,
        });
        let userResponse;
        if (userExists.length) {
          userResponse = userExists[0];
        } else {
          const userName = await UtilsService.createUserName(
            userData.firstName,
            userData.lastName,
            communityData.id,
          );
          userData.userName = userName;
          userResponse = await this.userService.addUser(userData);

          /* Add User Avatar */
          const content = await UtilsService.getUserAvatar(
            userResponse.firstName,
            userResponse.lastName,
            USER_AVATAR.size,
            USER_AVATAR.background,
            USER_AVATAR.color,
          );
          const avatarUrl = await this.awsS3Service.uploadImage(
            {
              buffer: content,
              mimetype: USER_AVATAR.mimeType,
            },
            USER_AVATAR.bucketPath,
          );
          const userAttachmentResponse = await this.userAttachmentService.addUserAttachment(
            {
              user: userResponse.id,
              attachmentType: USER_AVATAR.type,
              url: avatarUrl,
              community: communityData.id,
            },
          );
          await this.userService.updateUser(
            { id: userResponse.id },
            {
              profileImage: userAttachmentResponse.id,
            },
            '',
            false,
          );
          if (!userResponse.region) {
            const ip = req.clientIp;
            const userUpdatedObjectForLocation = UtilsService.getUserLocationByIp(
              ip,
            );
            if (userUpdatedObjectForLocation !== null) {
              await this.userService.updateUser(
                { id: userResponse.id },
                userUpdatedObjectForLocation,
                communityData.id,
                true,
              );
            }
          }
          /* End Add User Avatar */

          userResponse = await this.userService.getOneUser({
            where: { email: userData.email },
            relations: userRelations,
          });
        }

        // assign required role
        await this.roleActorService.addRoleActors({
          role: inviteData[0].role,
          actorType: RoleActorTypes.USER,
          actorId: userResponse.id,
          entityObjectId: null,
          entityType: null,
          community: communityData.id,
        });

        await getConnection()
          .query(`INSERT INTO public.user_communities_community(
            user_id, community_id)
            VALUES ('${userResponse.id}', '${communityData.id}')`);

        // Add user to groups.
        if (inviteData[0].circles && inviteData[0].circles.length) {
          const circleUsers = inviteData[0].circles.map(group => ({
            user: userResponse,
            circle: group,
            role: UserRole.USER,
          }));
          const userCirclesRepository = getRepository(UserCircles);
          const createdData = userCirclesRepository.create(circleUsers);
          await userCirclesRepository.save(createdData);
        }

        await this.inviteService.updateInvite(
          { id: inviteData[0].id },
          { inviteAccepted: true },
        );
        await CommunityActionPoints.addUserPoints({
          actionType: ACTION_TYPES.ACCEPT_INVITE,
          entityTypeName: ENTITY_TYPES.USER,
          community: communityData.id,
          userId: inviteData[0].user.id,
          entityObjectId: userResponse.id,
        });
        userResponse['currentCommunity'] = communityData;
        const token = await this.authService.createToken([userResponse]);
        delete userResponse.password;
        const finalUserResponse: {} = { ...userResponse };
        finalUserResponse['communities'] = [communityData];

        await this.inviteGateway.pushInvites(communityData.id);
        const userDataForElasticSearch = await this.userService.getOneUser({
          where: { id: userResponse.id },
        });
        userDataForElasticSearch['communityId'] = communityData.id;

        this.elasticSearchService.addUserData(userDataForElasticSearch);
        res.cookie(`${urlCommunity}`, token.fullToken, {
          httpOnly: true,
          sameSite:
            this.configService.get('COOKIE_SAME_SITE') ||
            this.cookieSameSiteDefault,
        });
        res.cookie('refresh-token', token.refreshToken, {
          httpOnly: true,
          sameSite:
            this.configService.get('COOKIE_SAME_SITE') ||
            this.cookieSameSiteDefault,
        });

        res.send({
          statusCode: HttpStatus.OK,
          wasSuccess: true,
          message: 'User Registered',
          response: {
            user: finalUserResponse,
            loginStatus: true,
          },
        });
      } else {
        res.send({
          statusCode: HttpStatus.OK,
          wasSuccess: true,
          message: 'Invite does not exist',
          response: {
            loginStatus: false,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  }
  @Post('reset-password')
  async resetUserPassword(
    @Body() body: UserResetPassDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    try {
      //   const emailTemplates = await this.emailTemplateService.getEmailTemplates({
      //     where: { name: 'resetPassword' },
      //   });
      const options = {
        where: body,
        relations: ['userCommunities', 'userCommunities.community'],
      };
      const user = await this.userService.getUsers(options);
      const originUrl = req.headers.origin;

      if (!user.length) {
        return ResponseFormatService.responseUnprocessableEntity(
          [],
          'No users foumd against the provided email',
        );
      }
      const resetData = {
        isDeleted: false,
        updatedBy: user[0].userName,
        createdBy: user[0].userName,
        userId: user[0].id,
        expiryDate: moment().add(1, 'days'),
        resetCode: bcrypt.hashSync(user[0].email, 10).replace(/[\/,?]/g, ''),
      };
      await this.passwordResetService.deletePasswordReset({
        where: {
          userId: user[0].id,
        },
      });

      const addedResetEntry = await this.passwordResetService.addPasswordReset(
        resetData,
      );

      if (addedResetEntry) {
        await this.userService.addResetPasswordEmail({
          code: addedResetEntry.resetCode,
          to: user[0].email,
          firstName: user[0].firstName,
          url: originUrl,
          community: _.head(_.head(user).userCommunities).communityId,
          communityName: _.head(_.head(user).userCommunities).community.name,
        });

        return ResponseFormatService.responseOk(
          addedResetEntry,
          'Reset link has been sent seccessfully',
        );
      }
    } catch (error) {
      throw new BadRequestException();
    }
  }
  @Get('switch-user-community')
  async switchUserCommunity(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const originUrl = parse(req.headers.origin.toString());

    const urlCommunity = originUrl.subdomain
      ? originUrl.subdomain
      : originUrl.domainWithoutSuffix;
    const tempTokenArray = req.headers['cookie']
      ? _.map(req.headers['cookie'].split(';'), (_val, _key) => {
          if (_val.includes(`${urlCommunity}=`)) {
            return { accessToken: _val.replace(`${urlCommunity}=`, '') };
          }
          if (_val.includes('refresh-token=')) {
            return { refreshToken: _val.replace('refresh-token=', '') };
          }
        })
      : [];
    const tokens = _.reduce(
      _.compact(tempTokenArray),
      function(memo, current) {
        return _.assign(memo, current);
      },
      {},
    );

    // const accessToken = tokens['accessToken'].trim();
    const refreshToken = tokens['refreshToken'].trim();
    const decoded = await jwt.verify(
      refreshToken.toString().trim(),
      this.configService.get('JWT_SECRET_KEY'),
      async res => {
        if (res == null) {
          return jwt.decode(refreshToken);
        } else {
          throw new UnauthorizedException();
        }
      },
    );
    const userData = await this.userService.getUsers({
      where: { id: decoded['id'] },
    });

    const userFullData = await this.userService.getUsers({
      relations: [
        'userCommunities',
        'userCommunities.community',
        'opportunities',
        'opportunities.opportunityType',
        'profileImage',
      ],
      where: {
        email: _.head(userData).email,
      },
    });
    const communityFindResult: {} = this.findUserCommunity(
      userFullData[0].userCommunities,
      req.headers.origin,
    );
    if (!communityFindResult) {
      throw new UnauthorizedException();
    }
    userFullData[0]['currentCommunity'] = communityFindResult['community'];
    /**
     * Updating Object Structure for front end
     */
    const userCommunitiesTemp = [];
    for (const i of userFullData[0].userCommunities) {
      userCommunitiesTemp.push(i.community);
    }
    if (userFullData[0].skills && userFullData[0].skills.length) {
      userFullData[0]['skillsData'] = await this.tagService.getTags({
        where: { id: In(userFullData[0].skills) },
      });
    }
    userFullData[0]['communities'] = userCommunitiesTemp;
    delete userFullData[0].userCommunities;
    /**
     * Updating Object Structure for front end
     */
    const token = await this.authService.createToken(userFullData);

    res.cookie(`${urlCommunity}`, token.fullToken, {
      httpOnly: true,
      sameSite:
        this.configService.get('COOKIE_SAME_SITE') ||
        this.cookieSameSiteDefault,
    });
    res.cookie('refresh-token', token.refreshToken, {
      httpOnly: true,
      sameSite:
        this.configService.get('COOKIE_SAME_SITE') ||
        this.cookieSameSiteDefault,
    });

    res.send({
      statusCode: HttpStatus.OK,
      wasSuccess: true,
      message: 'User Logged In Successfully',
      response: {
        user: userFullData[0],
        loginStatus: true,
      },
    });
  }
  // ---
  @Post('token')
  /**
   * Get Access Token to Integrate External APPS
   * @param {} body clientId, clientSecret, redirectUri
   * @param {} req community from request
   * @return Access Token
   */
  async getAccessToken(
    @Body() body: AccessTokenDto,
    @Req() req: Request,
  ): Promise<{}> {
    const findIntegrationOptions = {
      clientId: body.client_id,
      community: req['userData']['currentCommunity'],
      redirectUrl: body.redirect_uri,
      user: req['userData'].id,
    };
    const integrationData = await this.integrationService.getIntegrations({
      where: findIntegrationOptions,
    });

    //Autorize Access Only
    if (integrationData.length == 0) {
      throw new UnauthorizedException();
    }

    //Get Access Token
    const accessToken = await this.authService.accessToken({
      clientId: body.client_id,
      clientSecret: body.client_secret,
    });

    //Update Newly Created Token
    await this.integrationService.updateIntegration(
      { clinetId: body.client_id },
      { token: accessToken.fullToken, refreshToken: accessToken.refreshToken },
    );
    return {
      // eslint-disable-next-line @typescript-eslint/camelcase
      access_token: accessToken.fullToken,
      // eslint-disable-next-line @typescript-eslint/camelcase
      refresh_token: accessToken.refreshToken,
    };
  }
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Body() body: RefreshTokenBodyDto,
  ): Promise<{}> {
    const authorization = req.headers['authorization']
      ? req.headers['authorization'].split(' ')
      : '';
    const refreshToken = body.refreshToken;

    // Get Access Token From Authorization Header OR Get Auth Token From AuthV2 Call
    const finalToken =
      authorization.length > 0 && authorization[0] == 'Bearer'
        ? authorization[1]
        : req.body.code;
    const decoded = jwt.decode(finalToken.toString().trim());

    const integrationData = await this.integrationService.getIntegrations({
      where: { refreshToken: refreshToken },
    });

    //Autorize Access Only
    if (integrationData.length == 0) {
      throw new UnauthorizedException();
    }

    //Get Access Token
    const accessToken = await this.authService.accessToken({
      clientId: decoded['id'],
      clientSecret: decoded['secret'],
    });

    //Update Newly Created Token
    await this.integrationService.updateIntegration(
      { clinetId: decoded['id'] },
      { token: accessToken.fullToken, refreshToken: accessToken.refreshToken },
    );
    return {
      // eslint-disable-next-line @typescript-eslint/camelcase
      access_token: accessToken.fullToken,
      // eslint-disable-next-line @typescript-eslint/camelcase
      refresh_token: accessToken.refreshToken,
    };
  }

  @Get('saml-callback-url')
  async getSamlCallbackUrl(@Req() req: Request): Promise<ResponseFormat> {
    const communityData = await this.communityService.getOneCommunity({
      where: { id: req['accessToken']['currentCommunity'] },
    });
    const samlCallbackUrl =
      this.configService.get('SAML_CALLBACK_URL') + communityData.communitySlug;
    return ResponseFormatService.responseOk(
      { url: samlCallbackUrl },
      'SAML Callback Url',
    );
  }

  // SAML
  @Get('saml')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('saml'))
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  samlInitLogin(): void {
    // AuthGuard redirects to SSO service
  }

  @UseGuards(AuthGuard('saml'))
  @Post('reply-saml/:communitySlug')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async samlLogin(@Req() req, @Res() res, @Param() params): Promise<void> {
    const userSamlObject: SamlObject = req.user;
    // const email = body.email;
    const foundCommunity = await this.communityService.getOneCommunity({
      where: { communitySlug: params['communitySlug'] },
    });
    const samlUserEmail = userSamlObject.name || userSamlObject.email;
    const foundUser = await this.userService.getOneUser({
      where: { email: samlUserEmail },
    });

    let userFullData: UserEntity;
    if (foundUser && foundCommunity) {
      userFullData = await this.userService.getUserWithSpecificCommunity(
        foundUser.id,
        foundCommunity.id,
      );
    }

    if (userFullData) {
      userFullData['currentCommunity'] = _.head(userFullData.userCommunities)[
        'community'
      ];
    }
    let localPortSetting = '';
    if (this.configService.getEnv() === 'development') {
      localPortSetting = `:${this.configService.getNumber('CLIENT_PORT')}`;
    }
    let inviteFullData: InviteEntity[];
    if (!userFullData) {
      inviteFullData = await this.inviteService.getInvites({
        email: samlUserEmail,
        isDeleted: false,
        inviteAccepted: false,
        community: foundCommunity.id,
        isSSO: true,
      });
      if (!inviteFullData.length) {
        res.redirect(
          `${foundCommunity.url}${localPortSetting}/auth/login?e_status=1`,
        );
      }
      const inviteData = inviteFullData[0];
      let userData;
      if (!foundUser) {
        const userAddObject = {
          firstName: userSamlObject.givenname,
          lastName: userSamlObject.surname,
          userName: userSamlObject.givenname + userSamlObject.surname,
          email: samlUserEmail,
          lastLogin: new Date(),
        };
        userData = await this.userService.addUserWithoutDto(userAddObject);
      } else {
        userData = foundUser;
      }

      await getConnection()
        .query(`INSERT INTO public.user_communities_community(
            user_id, community_id)
            VALUES ('${userData.id}', '${inviteData.communityId}')`);

      userFullData = await this.userService.getOneUser({
        relations: ['userCommunities', 'userCommunities.community'],
        where: {
          email: samlUserEmail,
        },
      });

      // assign required role
      await this.roleActorService.addRoleActors({
        role: inviteData.roleId,
        actorType: RoleActorTypes.USER,
        actorId: userFullData.id,
        entityObjectId: null,
        entityType: null,
        community: inviteData.communityId,
      });
      const currentCommunity = await this.communityService.getOneCommunity({
        where: { id: inviteData.communityId },
      });
      userFullData['currentCommunity'] = currentCommunity;
      const userDataForElasticSearch = await this.userService.getOneUser({
        where: { id: userFullData.id },
      });
      userDataForElasticSearch['communityId'] = currentCommunity.id;

      this.elasticSearchService.addUserData(userDataForElasticSearch);
      await this.inviteService.updateInvite(
        { id: inviteData.id },
        { inviteAccepted: true },
      );
    }
    if (!userFullData.profileImage) {
      /* Add User Avatar */
      const content = await UtilsService.getUserAvatar(
        userFullData.firstName,
        userFullData.lastName,
        USER_AVATAR.size,
        USER_AVATAR.background,
        USER_AVATAR.color,
      );
      const avatarUrl = await this.awsS3Service.uploadImage(
        {
          buffer: content,
          mimetype: USER_AVATAR.mimeType,
        },
        USER_AVATAR.bucketPath,
      );
      const userAttachmentResponse = await this.userAttachmentService.addUserAttachment(
        {
          user: userFullData.id,
          attachmentType: USER_AVATAR.type,
          url: avatarUrl,
          community: userFullData['currentCommunity']['id'],
        },
      );
      await this.userService.updateUser(
        { id: userFullData.id },
        {
          profileImage: userAttachmentResponse.id,
        },
        '',
        false,
      );
      userFullData.profileImage = userAttachmentResponse;
      /* Add User Avatar */
    }
    const token = await this.authService.createToken([userFullData]);

    res.cookie(`${token.currentCommunityObj['name']}`, token.fullToken, {
      httpOnly: true,
      sameSite:
        this.configService.get('COOKIE_SAME_SITE') ||
        this.cookieSameSiteDefault,
    });
    res.cookie('refresh-token', token.refreshToken, {
      httpOnly: true,
      sameSite:
        this.configService.get('COOKIE_SAME_SITE') ||
        this.cookieSameSiteDefault,
    });

    res.redirect(
      `${token.currentCommunityObj['url']}${localPortSetting}/auth/community`,
    );
  }

  findUserCommunity(userCommunitiesObject, communityUrl): {} {
    const matchedCommunity = _.find(userCommunitiesObject, function(o) {
      return parse(o.community.url).hostname === parse(communityUrl).hostname;
    });
    return matchedCommunity;
  }
}
