import {
  Controller,
  Get,
  Query,
  Logger,
  Req,
  Body,
  Patch,
} from '@nestjs/common';

import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { ActivityLogService } from './activityLog.service';
import { Request } from 'express';
import { EntityMetaService } from '../../shared/services/EntityMeta.service';
import { ENTITY_TYPES } from '../../common/constants/constants';
import { isArray } from 'util';
import { ChallengeService } from '../challenge/challenge.service';
import { In } from 'typeorm';

@Controller('activities')
export class ActivityLogController {
  private looger = new Logger('Notification Controller');
  constructor(
    private activityLogService: ActivityLogService,
    private challengeService: ChallengeService,
  ) {}

  @Get('user')
  async getAllActivityLogs(
    @Query() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    this.looger.log('getAllActivityLogs query', req['userData'].id);
    const activityData = await this.activityLogService.getUserActivityLogs({
      userId: req['userData'].id,
      community: queryParams.community,
    });
    return ResponseFormatService.responseOk(activityData, '');
  }

  @Get('search')
  async searchAllActivityLogs(
    @Query() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    this.looger.log('searchAllActivityLogs query', req['userData'].id);

    // Transforming request data into processable object.
    const challengeEntityTypeId = (await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.CHALLENGE,
    )).id;
    const oppEntityTypeId = (await EntityMetaService.getEntityTypeMetaByAbbreviation(
      ENTITY_TYPES.IDEA,
    )).id;

    // EntityType check ensures backwards compatibility.
    if (queryParams.entityType) {
      // If multiple object ids and types given.
      if (isArray(queryParams.entityObjectId)) {
        queryParams.entities = [];

        // Taking out all challenge opportunities in case of any challenge type.
        const challengeIds = queryParams.entityType
          .filter(type => type == challengeEntityTypeId)
          .map((_type, index) => queryParams.entityObjectId[index]);
        let challenges;
        if (challengeIds.length) {
          challenges = await this.challengeService.getChallenges({
            where: { id: In(challengeIds) },
            relations: ['challengeOpportunities'],
          });
        }
        queryParams.entityObjectId.forEach((obj, index) => {
          queryParams.entities.push({
            entityType: queryParams.entityType[index],
            entityObjectId: obj,
          });
          if (
            queryParams.entityType[index] == challengeEntityTypeId &&
            challengeIds.length
          ) {
            const challenge = challenges.find(ch => ch.id == obj);
            if (challenge) {
              for (const opp of challenge.challengeOpportunities) {
                queryParams.entities.push({
                  entityType: oppEntityTypeId,
                  entityObjectId: opp.id,
                });
              }
            }
          }
        });
      } else {
        // If sing object id and type given.
        queryParams.entities = [
          {
            entityType: queryParams.entityType,
            entityObjectId: queryParams.entityObjectId,
          },
        ];

        // Taking out all challenge opportunities in case of challenge type.
        if (queryParams.entityType == challengeEntityTypeId) {
          const challenge = await this.challengeService.getOneChallenge({
            where: { id: queryParams.entityObjectId },
            relations: ['challengeOpportunities'],
          });
          for (const opp of challenge.challengeOpportunities) {
            queryParams.entities.push({
              entityType: oppEntityTypeId,
              entityObjectId: opp.id,
            });
          }
        }
      }
    } else if (queryParams.entityObjectId) {
      // This is done for backwards compatibility. All the requests with no type
      // given are considered as opportunity type requests.
      if (isArray(queryParams.entityObjectId)) {
        queryParams.entities = queryParams.entityObjectId.map(obj => ({
          entityType: oppEntityTypeId,
          entityObjectId: obj,
        }));
      } else {
        queryParams.entities = [
          {
            entityType: oppEntityTypeId,
            entityObjectId: queryParams.entityObjectId,
          },
        ];
      }
    }

    const activityData = await this.activityLogService.searchActivityLogs({
      options: {
        where: {
          entityObjectId: queryParams.entityObjectId,
          entityName: queryParams.entityName,
          community: queryParams.community,
          userId: queryParams.userId,
          filterBy: queryParams.filterBy,
        },
        take: queryParams.take,
        skip: queryParams.skip,
        orderBy: queryParams.orderBy,
        orderType: queryParams.orderType,
        isActivity: true,
        entities: queryParams.entities,
      },
    });
    return ResponseFormatService.responseOk(activityData, '');
  }
  @Get('search/notifications')
  async searchAllNotifications(
    @Query() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    this.looger.log('searchAllActivityLogs query', req['userData'].id);
    const activityData = await this.activityLogService.searchActivityLogs({
      options: {
        where: {
          entityObjectId: queryParams.entityObjectId,
          entityName: queryParams.entityName,
          community: queryParams.community,
          userId: req['userData'].id,
          filterBy: queryParams.filterBy,
        },
        take: queryParams.take,
        skip: queryParams.skip,
        orderBy: queryParams.orderBy,
        orderType: queryParams.orderType,
        isNotification: true,
      },
    });
    return ResponseFormatService.responseOk(activityData, '');
  }

  @Patch('notifications/read')
  async readNotifications(@Body() body): Promise<ResponseFormat> {
    const activityData = await this.activityLogService.updateReadStatus(body);
    return ResponseFormatService.responseOk(activityData, '');
  }
}
