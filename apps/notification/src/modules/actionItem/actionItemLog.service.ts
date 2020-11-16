import { Injectable } from '@nestjs/common';
import { ActionItemLogRepository } from './actionItemLog.repository';
import { ActionItemLogEntity } from './actionItemLog.entity';
import { isArray } from 'util';
import { Brackets } from 'typeorm';
import { ActionItemLogGateway } from './actionItemLog.gateway';

@Injectable()
export class ActionItemLogService {
  constructor(
    public readonly actionItemLogRepository: ActionItemLogRepository,
    private readonly actionItemLogGateway: ActionItemLogGateway,
  ) {}

  /**
   * Get actionItemLogs
   */
  async getActionItemLogs(options: {}): Promise<
    [ActionItemLogEntity[], number]
  > {
    return this.actionItemLogRepository.findAndCount(options);
  }

  /**
   * Search actionItemLogs
   */
  async searchActionItemLogs(options: {
    entityObjectId?: number | number[];
    entityType?: number;
    entityTypeName?: string;
    community: number;
    userId?: number;
    actionItemAbbreviation?: string;
    take: number;
    skip: number;
    orderBy?: string;
    orderType?: 'ASC' | 'DESC';
    isLog?: boolean;
    isNotification?: boolean;
    isEmail?: boolean;
    entities?: {
      entityType: number;
      entityObjectId: number;
    }[];
  }): Promise<{}> {
    if (options.entityObjectId && !isArray(options.entityObjectId)) {
      options.entityObjectId = [options.entityObjectId];
    }

    const query = await this.actionItemLogRepository.createQueryBuilder(
      'action_item_log',
    );

    if (options.community) {
      query.andWhere(`action_item_log.community = :community`, {
        community: options.community,
      });
    }
    if (options.userId) {
      query.andWhere(`action_item_log.userId = :userId`, {
        userId: options.userId,
      });
    }
    if (options.isLog) {
      query.andWhere(`action_item_log.isLog = true`);
    }
    if (options.isNotification) {
      query.andWhere(`action_item_log.isNotification = true`);
    }
    if (options.entityTypeName) {
      query.andWhere(`action_item_log.entityTypeName = :entityTypeName`, {
        entityTypeName: options.entityTypeName,
      });
    }
    if (options.actionItemAbbreviation) {
      query.andWhere(
        `action_item_log.actionItemAbbreviation = :actionItemAbbreviation`,
        {
          actionItemAbbreviation: options.actionItemAbbreviation,
        },
      );
    }

    if (options.entities) {
      query.andWhere(
        new Brackets(qb => {
          options.entities.forEach((entity, index) => {
            qb.orWhere(
              new Brackets(nqb => {
                nqb.andWhere(
                  `action_item_log.entityObjectId = :entityObjectId${index}`,
                  {
                    [`entityObjectId${index}`]: entity.entityObjectId,
                  },
                );
                nqb.andWhere(
                  `action_item_log.entityTypeId = :entityTypeId${index}`,
                  {
                    [`entityTypeId${index}`]: entity.entityType,
                  },
                );
              }),
            );
          });
        }),
      );
    }

    const actionItemLogData = await query
      .skip(options.skip)
      .take(options.take)
      .orderBy(
        options.orderBy
          ? 'action_item_log.' + options.orderBy
          : 'action_item_log.createdAt',
        options.orderType ? options.orderType : 'DESC',
      )
      .getManyAndCount();

    // TODO: Handle aggregation logic.
    // const aggregatedData = groupBy(actionItemLogData[0], 'aggregatedId');
    // const tempData = [];
    // map(aggregatedData, (_val, _key) => {
    //   if (_val.length > 1) {
    //     const tempDataObject = cloneDeep(_val[0]);
    //     tempDataObject['aggregatedCount'] = _val.length;
    //     tempDataObject['aggregatedData'] = [];
    //     map(_val, val => {
    //       if (
    //         !find(tempDataObject['aggregatedData'], function(o) {
    //           return o.userId === val.userId;
    //         })
    //       ) {
    //         tempDataObject['aggregatedData'].push({
    //           userName: val.userName,
    //           userId: val.userId,
    //         });
    //       }
    //     });
    //     tempData.push(tempDataObject);
    //   } else {
    //     tempData.push(_val[0]);
    //   }
    // });
    // /* For aggreagetd data */
    // actionItemLogData[0] = tempData;

    return actionItemLogData;
  }

  /**
   * Add actionItemLog
   */
  async addActionItemLog(data: {}): Promise<ActionItemLogEntity> {
    data['isDeleted'] = false;
    const actionItemLogCreated = this.actionItemLogRepository.create(data);
    const actionItemLogSaved = await this.actionItemLogRepository.save(
      actionItemLogCreated,
    );

    // pushing action item log to socket.
    await this.actionItemLogGateway.pushActionItemLog(
      actionItemLogSaved,
      actionItemLogSaved.userId,
      actionItemLogSaved.community,
    );

    return actionItemLogSaved;
  }

  /**
   * Update actionItemLog
   */
  async updateActionItemLog(options: {}, data: {}): Promise<{}> {
    return this.actionItemLogRepository.update(options, data);
  }

  /**
   * Delete actionItemLog
   */
  async deleteActionItemLog(options: {}): Promise<{}> {
    return this.actionItemLogRepository.delete(options);
  }
}
