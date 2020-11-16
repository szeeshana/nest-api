import { Injectable, Logger } from '@nestjs/common';
import { ActivityLogEntity } from '../modules/activityLog/activityLog.entity';
import { getConnection, Brackets } from 'typeorm';
import * as _ from 'lodash';
import * as moment from 'moment';
import uuid = require('uuid');

@Injectable()
export class AggregateActivityLogs {
  private readonly logger = new Logger();
  async main() {
    this.logger.warn('************Aggregating Activity Logs************');
    const entityTypeData = await getConnection()
      .createQueryBuilder()
      .select('actionType.name', 'actionTypeName')
      .addSelect('actionType.id', 'actionTypeId')
      .addSelect('array_agg(activityLog.id)', 'activityLogIds')
      .addSelect('array_agg(activityLog.entityObjectId)', 'entityObjectId')
      .from(ActivityLogEntity, 'activityLog')
      .leftJoin('activityLog.actionType', 'actionType')
      .where('activityLog.createdAt < :created', {
        created: moment().subtract(1, 'hour'),
      })
      .andWhere(
        new Brackets(qb => {
          qb.orWhere('actionType.name = :voteName', {
            voteName: 'Upvote',
          })
            .orWhere('actionType.name = :viewName', {
              viewName: 'View',
            })
            .orWhere('actionType.name = :followName', {
              followName: 'Follow',
            });
        }),
      )
      .groupBy('actionType.id')
      .addGroupBy('activityLog.entityObjectId')
      .addGroupBy('activityLog.community')
      .getRawMany();

    const updateActivityLogArr = [];
    _.mapValues(
      entityTypeData,
      (val: {
        actionTypeName: string;
        actionTypeId: number;
        activityLogIds: [];
        entityObjectId: [];
      }) => {
        const temp = getConnection()
          .createQueryBuilder()
          .update(ActivityLogEntity)
          .set({ aggregatedId: uuid() })
          .where('id IN (:...ids)', {
            ids: val.activityLogIds,
          })
          .execute();
        updateActivityLogArr.push(temp);
      },
    );
    const updatedData = await Promise.all(updateActivityLogArr);
    this.logger.log(JSON.stringify(updatedData));
  }
}
