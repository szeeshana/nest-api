import { ExceptionFilter } from './../../filters/rpcException.filter';
import { Controller, UseFilters } from '@nestjs/common';

import { ActivityLogService } from './activityLog.service';
// import { ResponseFormatService } from '../../shared/services/response-format.service';
// import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { MessagePattern } from '@nestjs/microservices';
import * as _ from 'lodash';
import * as moment from 'moment';

@Controller()
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('getActivityLogByUser')
  async getAllActivityLogs(data: {
    userId: number;
    community: number;
  }): Promise<{}> {
    const activityLogs = await this.activityLogService.getActivityLogs({
      relations: ['actionType'],
      where: {
        userId: data.userId,
        community: data.community,
      },
    });
    return activityLogs;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('searchActivityLogs')
  async searchActivityLogs(data: {
    options: {
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
    };
  }): Promise<{}> {
    const queryOptions = {
      where: {
        entityObjectId: data.options.where.entityObjectId,
        entityName: data.options.where.entityName,
        community: data.options.where.community,
        userId: data.options.where.userId,
        actorId: data.options.where.actorId,
        filterBy: data.options.where.filterBy,
      },
      take: data.options.take || 20,
      skip: data.options.skip || 0,
      orderBy: data.options.orderBy,
      orderType: data.options.orderType,
      isNotification: data.options.isNotification,
      isActivity: data.options.isActivity,
      entities: data.options.entities,
    };

    const activityLogs = await this.activityLogService.searchActivityLogs(
      queryOptions,
    );
    const queryOptionsForCount = _.cloneDeep(queryOptions);
    delete queryOptionsForCount.take;
    delete queryOptionsForCount.skip;
    delete queryOptionsForCount.where.filterBy;
    const activityLogsTotal = await this.activityLogService.searchActivityLogs(
      queryOptionsForCount,
    );
    const countData = _.countBy(
      activityLogsTotal[0],
      'actionType.abbreviation',
    );
    const unreadNotiications = _.countBy(activityLogsTotal[0], function(rec) {
      return rec.isRead == 0;
    });
    let allActivities = 0;
    _.map(countData, function(val, _key) {
      allActivities = allActivities + val;
    });
    countData['all'] = allActivities;
    activityLogs[2] = countData;
    if (data.options.isNotification) {
      const today = _.filter(activityLogs[0], function(o: any) {
        return moment().diff(moment(o.createdAt), 'd') == 0;
      });
      const past = _.filter(activityLogs[0], function(o: any) {
        return moment().diff(moment(o.createdAt), 'd') > 0;
      });

      const notificationData = {
        today,
        past,
        count: activityLogs[1],
        unreadCount: unreadNotiications.true,
      };
      return notificationData;
    }
    return activityLogs;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('addActivityLogs')
  async addActivityLogs(data: {} | []): Promise<{}> {
    const addedData = await this.activityLogService.addActivityLog(data);
    return addedData;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('updateReadStatus')
  async updateReadStatus(data): Promise<{}> {
    const effectedData = await this.activityLogService.updateActivityLog(data, {
      isRead: 1,
    });
    return effectedData;
  }
}
