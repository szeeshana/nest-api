import { Injectable } from '@nestjs/common';
import { ActivityLogRepository } from './activityLog.repository';
import { ActivityLogEntity } from './activityLog.entity';
import * as _ from 'lodash';
import { isArray } from 'util';
import { Brackets } from 'typeorm';
import { ActivityLogGateway } from './activityLog.gateway';
// import moment = require('moment');

@Injectable()
export class ActivityLogService {
  constructor(
    public readonly activityLogRepository: ActivityLogRepository,
    public readonly activityLogGateway: ActivityLogGateway,
  ) {}

  /**
   * Get activityLogs
   */
  async getActivityLogs(options: {}): Promise<[ActivityLogEntity[], number]> {
    return this.activityLogRepository.findAndCount(options);
  }

  /**
   * Get activityLogs
   */
  async getOneActivityLog(options: {}): Promise<ActivityLogEntity> {
    return this.activityLogRepository.findOne(options);
  }

  /**
   * Search activityLogs
   */
  async searchActivityLogs(options: {
    where: {
      entityObjectId: number | number[];
      entityName: string;
      community: number;
      userId: number;
      actorId: number;
      filterBy: string;
    };
    take: number;
    skip: number;
    orderBy: string;
    orderType: 'ASC' | 'DESC';
    isNotification: boolean;
    isActivity: boolean;
    entities?: {
      entityType: number;
      entityObjectId: number;
      entityName?: string;
    }[];
  }): Promise<{}> {
    if (
      options.where.entityObjectId &&
      !isArray(options.where.entityObjectId)
    ) {
      options.where.entityObjectId = [options.where.entityObjectId];
    }
    const query = await this.activityLogRepository
      .createQueryBuilder('activity_log')
      .leftJoinAndSelect('activity_log.actionType', 'actionType')
      .andWhere(
        options.where.community ? `activity_log.community = :community` : '1=1',
        {
          community: options.where.community,
        },
      )
      .andWhere(
        options.isNotification && options.where.userId
          ? `activity_log.userId = :userId`
          : '1=1',
        {
          userId: options.where.userId,
        },
      )
      .andWhere(
        options.isNotification && options.where.userId
          ? `activity_log.userId != activity_log.actorUserId`
          : '1=1',
      )
      .andWhere(
        options.isNotification ? `activity_log.isNotification = true` : '1=1',
      )
      .andWhere(
        options.isActivity && options.where.userId
          ? `activity_log.actorUserId = :actorId`
          : '1=1',
        {
          actorId: options.where.userId,
        },
      )
      .andWhere(options.isActivity ? `activity_log.isActivity = true` : '1=1');

    if (options.entities) {
      query.andWhere(
        new Brackets(qb => {
          options.entities.forEach((entity, index) => {
            qb.orWhere(
              new Brackets(nqb => {
                nqb.andWhere(
                  `activity_log.entityObjectId = :entityObjectId${index}`,
                  {
                    [`entityObjectId${index}`]: entity.entityObjectId,
                  },
                );
                nqb.andWhere(`activity_log.entityId = :entityId${index}`, {
                  [`entityId${index}`]: entity.entityType,
                });
              }),
            );
          });
        }),
      );
    }

    const activityLogData = await query
      .andWhere(
        options.where.entityName
          ? `activity_log.entityName = :entityName`
          : '1=1',
        {
          entityName: options.where.entityName,
        },
      )
      .andWhere(
        options.where.filterBy
          ? `actionType.abbreviation = :abbreviation`
          : '1=1',
        {
          abbreviation: options.where.filterBy,
        },
      )
      .skip(options.skip)
      .take(options.take)
      .orderBy(
        options.orderBy
          ? 'activity_log.' + options.orderBy
          : 'activity_log.createdAt',
        options.orderType ? options.orderType : 'DESC',
      )
      .getManyAndCount();

    const aggregatedData = _.groupBy(activityLogData[0], 'aggregatedId');
    const tempData = [];
    _.map(aggregatedData, (_val, _key) => {
      if (_val.length > 1) {
        const tempDataObject = _.cloneDeep(_val[0]);
        tempDataObject['aggregatedCount'] = _val.length;
        tempDataObject['aggregatedData'] = [];

        _.map(_val, val => {
          if (
            !_.find(tempDataObject['aggregatedData'], function(o) {
              return o.userId === val.actorUserId;
            })
          ) {
            tempDataObject['aggregatedData'].push({
              userName: val.actorUserName,
              userId: val.actorUserId,
            });
          }
        });
        tempData.push(tempDataObject);
      } else {
        tempData.push(_val[0]);
      }
    });

    /* For aggreagetd data */
    activityLogData[0] = tempData;
    // delete activityLogData[1];
    // activityLogData[1] = activityLogData[1];
    /* For aggreagetd data */

    return activityLogData;

    // return this.activityLogRepository
    //   .createQueryBuilder('activity_log')
    //   .leftJoinAndSelect('activity_log.actionType', 'actionType')
    //   .andWhere(
    //     options.where.community ? `activity_log.community = :community` : '1=1',
    //     {
    //       community: options.where.community,
    //     },
    //   )
    //   .andWhere(
    //     options.where.userId ? `activity_log.userId = :userId` : '1=1',
    //     {
    //       userId: options.where.userId,
    //     },
    //   )
    //   .andWhere(
    //     options.where.entityObjectId
    //       ? `activity_log.entityObjectId = :entityObjectId`
    //       : '1=1',
    //     {
    //       entityObjectId: options.where.entityObjectId,
    //     },
    //   )
    //   .andWhere(
    //     options.where.entityName
    //       ? `activity_log.entityName = :entityName`
    //       : '1=1',
    //     {
    //       entityName: options.where.entityName,
    //     },
    //   )
    //   .andWhere(
    //     options.where.filterBy
    //       ? `actionType.abbreviation = :abbreviation`
    //       : '1=1',
    //     {
    //       abbreviation: options.where.filterBy,
    //     },
    //   )
    //   .skip(options.skip)
    //   .take(options.take)
    //   .orderBy(
    //     options.orderBy
    //       ? 'activity_log.' + options.orderBy
    //       : 'activity_log.createdAt',
    //     options.orderType ? options.orderType : 'DESC',
    //   )
    //   .getManyAndCount();
  }

  /**
   * Add activityLog
   */
  async addActivityLog(data: {}): Promise<ActivityLogEntity> {
    const activityLogCreated = this.activityLogRepository.create(data);
    const activityLogSaved = await this.activityLogRepository.save(
      activityLogCreated,
    );

    if (
      activityLogSaved.isNotification &&
      activityLogSaved.userId !== activityLogSaved.actorUserId
    ) {
      // pushing activity log notification to socket.
      const log = await this.getOneActivityLog({
        where: { id: activityLogSaved.id },
        relations: ['actionType'],
      });
      await this.activityLogGateway.pushActivityLog({
        activityLog: log,
        userId: activityLogSaved.userId,
        community: activityLogSaved.community,
        isNotification: true,
      });
    }

    return activityLogSaved;
  }

  /**
   * Update activityLog
   */
  async updateActivityLog(options: {}, data: {}): Promise<{}> {
    return this.activityLogRepository.update(options, data);
  }

  /**
   * Delete activityLog
   */
  async deleteActivityLog(options: {}): Promise<{}> {
    return this.activityLogRepository.delete(options);
  }
}
