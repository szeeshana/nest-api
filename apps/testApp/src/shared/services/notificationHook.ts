import { Injectable, Logger } from '@nestjs/common';
import { EntityMetaService } from './EntityMeta.service';
import { ClientProxyFactory, ClientProxy } from '@nestjs/microservices';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { ConfigService } from './config.service';
import {
  ENTITY_TYPES,
  STAGE_EMAIL_REMIDER_TO_SECONDS_MAP,
  MESSAGES_FOR_ACTION_ITEM_NOTIFICATION,
} from '../../common/constants/constants';
import { UserEntity } from '../../modules/user/user.entity';
import * as moment from 'moment-timezone';
import { UtilsService } from '../../providers/utils.service';
import { StageHistoryEntity } from '../../modules/stage/stageHistory.entity';
import { getConnection } from 'typeorm';
import { StageEntity } from '../../modules/stage/stage.entity';
import { OpportunityEntity } from '../../modules/opportunity/opportunity.entity';
import { ActionItemEntity } from '../../modules/actionItem/actionItem.entity';
import { CommunityEntity } from '../../modules/community/community.entity';
import { CriteriaScoreInterface } from '../../modules/evaluationCriteria/interface/criteriaScore.interface';
import { OpportunityEvaluationResponseEntity } from '../../modules/evaluationCriteria/opportunityEvaluationResponse.entity';

@Injectable()
export class NotificationHookService {
  static async notificationHook(params): Promise<void> {
    try {
      const loger = new Logger('Notification Hook Shared Service - Main App');
      const configService = new ConfigService();
      const client: ClientProxy = ClientProxyFactory.create({
        transport: Transport.REDIS,
        options: {
          url: configService.get('REDIS_URL'),
        },
      });
      const entityType = await EntityMetaService.getEntityTypeMeta({
        objectId: params.actionData.entityType,
      });

      const entityData = await EntityMetaService.getEntityObjectByEntityType(
        entityType['entityTable'],
        params.actionData.entityObjectId,
        entityType['abbreviation'] === ENTITY_TYPES.IDEA
          ? ['user', 'opportunityType']
          : ['user'],
      );

      const actionTypeData = await client
        .send('getActionTypes', { abbreviation: params.actionType })
        .toPromise();
      const communityData = await getConnection()
        .createQueryBuilder()
        .select('community')
        .from(CommunityEntity, 'community')
        .where('community.id = :id', {
          id: params.actorData.community,
        })
        .getOne();
      const addActivityLogData = {
        userId: entityData['user'].id,
        userName:
          entityData['user'].firstName + ' ' + entityData['user'].lastName,
        userEmail: entityData['user'].email,
        actorUserId: params.actorData.id,
        actorUserName: params.actorData.firstName,
        actorUserEmail: params.actorData.email,
        entityObjectId: params.actionData.entityObjectId,
        entityId: entityType['id'],
        entityName: entityType['abbreviation'],
        entityTitle: entityData['title'],
        entityDescription: entityData['description'],
        community: params.actorData.community,
        communityName: communityData.name,
        isDeleted: false,
        actionType: actionTypeData[0].id,
        aggregatedId: new Date().getTime(),
      };
      if (params.invertUser) {
        addActivityLogData.userId = params.actionData.user.id;
        addActivityLogData.userName =
          params.actionData.user.firstName +
          ' ' +
          params.actionData.user.lastName;
        addActivityLogData.userEmail = params.actionData.user.email;
      }
      if (params.invertTitle) {
        if (params.invertTitleKeys) {
          addActivityLogData.entityTitle =
            params.actionData[params.invertTitleKeys.title];
        }
      }
      if (params.entityOperendObject) {
        addActivityLogData['entityOperendObject'] = params.entityOperendObject;
      }
      if (Object.keys(params).includes('isActivity')) {
        addActivityLogData['isActivity'] = params.isActivity;
      }
      if (Object.keys(params).includes('isNotification')) {
        addActivityLogData['isNotification'] = params.isNotification;
      }
      if (Object.keys(params).includes('isEmail')) {
        addActivityLogData['isEmail'] = params.isEmail;
      }
      if (
        entityType['abbreviation'] === ENTITY_TYPES.IDEA &&
        (!Object.keys(params).includes('changeOpportunityType') ||
          params.changeOpportunityType)
      ) {
        addActivityLogData['entityName'] =
          entityData['opportunityType']['name'];
      }

      if (
        addActivityLogData.userEmail === addActivityLogData.actorUserEmail &&
        !params.enableSameUserEmail
      ) {
        addActivityLogData['isEmail'] = false;
      }
      await client.send('addActivityLogs', addActivityLogData).toPromise();
      loger.log(params.actionType + ' Activity Added Successfuly');
    } catch (error) {
      throw error;
    }
  }

  static async actionItemLogHook(params: {
    entityTypeId: number;
    entityObjectId: number;
    userId: number;
    userName: string;
    userEmail: string;
    actionItemId: number;
    actionItemTitle: string;
    actionItemAbbreviation: string;
    actionDueDate?: Date;
    entityTitle: string;
    entityDescription?: string;
    entityImageUrl?: string;
    entityOperendObject?: {};
    community: number;
    communityName: string;
    isEmail?: boolean;
    isLog?: boolean;
    isNotification?: boolean;
    originUrl?: string;
  }): Promise<void> {
    try {
      const loger = new Logger(
        'Action Item Log Hook Shared Service - Main App',
      );
      const configService = new ConfigService();
      const client: ClientProxy = ClientProxyFactory.create({
        transport: Transport.REDIS,
        options: {
          url: configService.get('REDIS_URL'),
        },
      });

      const entityType = await EntityMetaService.getEntityTypeMeta({
        objectId: params.entityTypeId,
      });
      const entityData = await EntityMetaService.getEntityObjectByEntityType(
        entityType['entityTable'],
        params.entityObjectId,
        ['opportunityType'],
      );

      const actionItemLogData = {
        ...params,
        entityTypeName:
          entityType['abbreviation'] === ENTITY_TYPES.IDEA
            ? entityData['opportunityType']['name']
            : entityType['name'],
        isDeleted: false,
        aggregatedId: new Date().getTime(),
        ...(params.actionDueDate && {
          actionDueDate: moment
            .utc(params.actionDueDate)
            .endOf('day')
            .toDate(),
          url: UtilsService.generateOpportunityUrl(
            params.originUrl,
            params.entityObjectId,
          ),
          entityOperendObject: {
            detailedMessage: MESSAGES_FOR_ACTION_ITEM_NOTIFICATION.REFINEMENT,
          },
        }),
      };

      await client.send('addActionItemLogs', actionItemLogData).toPromise();
      loger.log('Action Item Log Added Successfuly');
    } catch (error) {
      throw error;
    }
  }

  static async addStageEmailHook(params: {
    emailType: string;
    entityType: number;
    entityObjectId: number;
    users: any;
    reminderFrequency: string;
    actionType: string;
    community: number;
    stageId: number;
  }): Promise<void> {
    try {
      const loger = new Logger(
        'Add Stage Email Settings Hook Shared Service - Main App',
      );
      const configService = new ConfigService();
      const client: ClientProxy = ClientProxyFactory.create({
        transport: Transport.REDIS,
        options: {
          url: configService.get('REDIS_URL'),
        },
      });

      // Delete existing email settings.
      await client
        .send('deleteStageEmailSetting', {
          entityType: params.entityType,
          entityObjectId: params.entityObjectId,
          community: params.community,
        })
        .toPromise();

      // // Add new email settings.
      // const actionTypeData = await client
      //   .send('getActionTypes', { abbreviation: params.actionType })
      //   .toPromise();

      const stageEmailData = params.users.map(user => ({
        emailType: params.emailType,
        entityType: params.entityType,
        entityObjectId: params.entityObjectId,
        userId: user.id,
        stageId: params.stageId,
        userEmail: user.email,
        reminderFrequency:
          STAGE_EMAIL_REMIDER_TO_SECONDS_MAP[params.reminderFrequency],
        timeZone: moment.tz.guess(),
        nextRun: moment()
          .utc()
          .format(),
        // actionType: actionTypeData[0].id,
        community: params.community,
      }));

      await client.send('addStageEmailSettings', stageEmailData).toPromise();
      loger.log('Stage Email Settings Added Successfuly');
    } catch (error) {
      throw error;
    }
  }

  static async addUsersToExistingStageEmailHook(params: {
    emailType: string;
    entityType: number;
    entityObjectId: number;
    users: UserEntity[];
    community: number;
  }): Promise<void> {
    try {
      const loger = new Logger(
        'Add Users to Existing Stage Email Settings Hook Shared Service - Main App',
      );
      const configService = new ConfigService();
      const client: ClientProxy = ClientProxyFactory.create({
        transport: Transport.REDIS,
        options: {
          url: configService.get('REDIS_URL'),
        },
      });

      const usersUpdated = params.users.map(user => ({
        userId: user.id,
        userEmail: user.email,
      }));

      await client
        .send('addUsersInStageEmailSettings', {
          params,
          data: usersUpdated,
        })
        .toPromise();
      loger.log('Users Added to Stage Emails Successfuly');
    } catch (error) {
      throw error;
    }
  }
  static async updateStageEmailSetting(params: {
    updateCondition: {};
    dataToUpdate: { isCompleted: number };
  }): Promise<void> {
    try {
      const loger = new Logger('Update Stage Email Setting when completed');
      const configService = new ConfigService();
      const client: ClientProxy = ClientProxyFactory.create({
        transport: Transport.REDIS,
        options: {
          url: configService.get('REDIS_URL'),
        },
      });
      await client
        .send('updateStageEmailSetting', {
          params: params.updateCondition,
          data: params.dataToUpdate,
        })
        .toPromise();
      loger.log('Updated Stage Email Setting Successfuly');
    } catch (error) {
      throw error;
    }
  }
  static async addStageHistory(params: {
    oldStageData: {
      stage: StageEntity;
      opportunity: OpportunityEntity;
      actionItem: ActionItemEntity;
      computeObject: {};
      enteringAt?: string;
      exitingAt?: string;
      community: CommunityEntity;
    };
  }): Promise<void> {
    try {
      const existingRecord = await getConnection()
        .createQueryBuilder()
        .select('stageHistory')
        .from(StageHistoryEntity, 'stageHistory')
        .where('stageHistory.opportunity = :opportunityId', {
          opportunityId: params.oldStageData.opportunity.id,
        })
        .andWhere('stageHistory.stage = :stageId', {
          stageId: params.oldStageData.stage.id,
        })
        .andWhere('stageHistory.community = :communityId', {
          communityId: params.oldStageData.community.id,
        })
        .getOne();

      if (existingRecord) {
        await getConnection()
          .createQueryBuilder()
          .update(StageHistoryEntity)
          .set({
            computeObject: params.oldStageData.computeObject,
            exitingAt: moment().format(),
          })
          .where('id = :id', { id: existingRecord.id })
          .execute();
      } else {
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(StageHistoryEntity)
          .values(params.oldStageData)
          .execute();
      }
    } catch (error) {
      throw error;
    }
  }

  static async addCriteriaFinalScores(params: {
    criteriaScores: CriteriaScoreInterface[];
    opportunity: number;
    entityType: number;
    entityObjectId: number;
  }): Promise<void> {
    try {
      await Promise.all(
        params.criteriaScores.map(score =>
          getConnection()
            .createQueryBuilder()
            .update(OpportunityEvaluationResponseEntity)
            .set({
              finalScore: score.rawNormalizedScore,
            })
            .where('evaluationCriteria = :evaluationCriteria', {
              evaluationCriteria: score.criteria.id,
            })
            .andWhere('opportunity = :opportunity', {
              opportunity: params.opportunity,
            })
            .andWhere('entityType = :entityType', {
              entityType: params.entityType,
            })
            .andWhere('entityObjectId = :entityObjectId', {
              entityObjectId: params.entityObjectId,
            })
            .execute(),
        ),
      );
    } catch (error) {
      throw error;
    }
  }
}
