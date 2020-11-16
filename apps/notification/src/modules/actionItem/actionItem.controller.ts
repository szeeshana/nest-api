import { ExceptionFilter } from '../../filters/rpcException.filter';
import { Controller, UseFilters } from '@nestjs/common';

import { ActionItemLogService } from './actionItemLog.service';
import { MessagePattern } from '@nestjs/microservices';
import { cloneDeep, countBy } from 'lodash';

@Controller()
export class ActionItemController {
  constructor(private readonly actionItemLogService: ActionItemLogService) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('searchActionItemLogs')
  async searchActionItemLogs(data: {
    options: {
      entityObjectId: number | number[];
      entityType: number;
      entityTypeName: string;
      community: number;
      userId: number;
      actionItemAbbreviation: string;
      take: number;
      skip: number;
      orderBy: string;
      orderType: 'ASC' | 'DESC';
      isNotification: boolean;
      isLog: boolean;
      entities?: {
        entityType: number;
        entityObjectId: number;
        entityName?: string;
      }[];
    };
  }): Promise<{}> {
    const queryOptions = {
      entityObjectId: data.options.entityObjectId,
      entityTypeName: data.options.entityTypeName,
      community: data.options.community,
      userId: data.options.userId,
      actionItemAbbreviation: data.options.actionItemAbbreviation,
      take: data.options.take || 20,
      skip: data.options.skip || 0,
      orderBy: data.options.orderBy,
      orderType: data.options.orderType,
      isNotification: data.options.isNotification,
      isLog: data.options.isLog,
      entities: data.options.entities,
    };

    const actionItemLogs = await this.actionItemLogService.searchActionItemLogs(
      queryOptions,
    );

    const queryOptionsForCount = cloneDeep(queryOptions);
    delete queryOptionsForCount.take;
    delete queryOptionsForCount.skip;
    delete queryOptionsForCount.actionItemAbbreviation;
    const actionItemLogsTotal = await this.actionItemLogService.searchActionItemLogs(
      queryOptionsForCount,
    );
    const readStatusNotiicationsCount = countBy(
      actionItemLogsTotal[0],
      rec => rec.isRead,
    );

    const actionItemLogsResponse = {
      actionItemLogs: actionItemLogs[0],
      totalCount: actionItemLogsTotal[1],
      ...(data.options.isNotification && {
        unreadCount: readStatusNotiicationsCount.false || 0,
      }),
    };

    return actionItemLogsResponse;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('addActionItemLogs')
  async addActionItemLogs(data: {} | []): Promise<{}> {
    const addedData = await this.actionItemLogService.addActionItemLog(data);
    return addedData;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('updateActionItemLogReadStatus')
  async updateReadStatus(data): Promise<{}> {
    const effectedData = await this.actionItemLogService.updateActionItemLog(
      data,
      { isRead: true },
    );
    return effectedData;
  }
}
