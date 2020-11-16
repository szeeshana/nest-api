import { Injectable } from '@nestjs/common';
import { OpportunityService } from '../opportunity/opportunity.service';
import { ChallengeService } from '../challenge/challenge.service';
import { VoteService } from '../vote/vote.service';
import { EntityTypeService } from '../entityType/entity.service';
import { In } from 'typeorm';
import {
  ENTITY_TYPES,
  USER_ACTION_POINT_FUNCTION_OPTIONS,
} from '../../common/constants/constants';
import { CommentService } from '../comment/comment.service';
import { ShareService } from '../share/share.service';
import { UserActionPointService } from '../userActionPoint/userActionPoint.service';
import { sumBy, groupBy, map } from 'lodash';
import { UtilsService } from '../../providers/utils.service';

@Injectable()
export class AnalyticsService {
  constructor(
    public opportunityService: OpportunityService,
    public challengeService: ChallengeService,
    public voteService: VoteService,
    public entityTypeService: EntityTypeService,
    public commentService: CommentService,
    public shareService: ShareService,
    public userActionPointService: UserActionPointService,
  ) {}

  /**
   * Get analyticss
   */
  async getActorEngagement(params: {
    challenge?: number;
    community: number;
  }): Promise<{}> {
    let where = {};
    where = { community: params.community };
    if (params.challenge) {
      where = { where, ...{ challenge: params.challenge } };
    }
    const opportunityData = await this.opportunityService.getOpportunities({
      where: where,
      select: ['id'],
    });
    const opportunityIds = map(opportunityData, 'id');
    if (!opportunityIds.length) {
      return {
        targeted: 0,
        viewed: 0,
        participated: 0,
      };
    }
    const opportunityEntityType = await this.entityTypeService.getOneEntityType(
      {
        where: { abbreviation: ENTITY_TYPES.IDEA },
      },
    );

    const voteCountsPromise = this.voteService.getVoteCount({
      where: {
        entityObjectId: In(opportunityIds),
        entityType: opportunityEntityType.id,
      },
    });
    const commentCountPromise = this.commentService.getCommentCount({
      where: {
        entityObjectId: In(opportunityIds),
        entityType: opportunityEntityType.id,
      },
    });

    const challengeViewCountPromise = this.challengeService.getOneChallenge({
      where: { id: params.challenge },
      select: ['viewCount'],
    });
    const [voteCount, commentCount, challengeViewCount] = await Promise.all([
      voteCountsPromise,
      commentCountPromise,
      challengeViewCountPromise,
    ]);

    const totalParticipatedCount =
      voteCount + commentCount + opportunityData.length;

    return {
      targeted: 0,
      viewed: parseInt(challengeViewCount.viewCount.toString()),
      participated: totalParticipatedCount,
    };
  }
  async getActivitySummary(params: {
    challenge?: number;
    community: number;
  }): Promise<{}> {
    let where = {};
    where = { community: params.community };
    if (params.challenge) {
      where = { where, ...{ challenge: params.challenge } };
    }
    const opportunityData = await this.opportunityService.getOpportunities({
      where: where,
      select: ['id'],
    });
    const opportunityIds = map(opportunityData, 'id');
    if (!opportunityIds.length) {
      return {
        counts: {
          submissions: 0,
          comments: 0,
          votes: 0,
          shares: 0,
          ratings: 0,
        },
        chartData: {},
      };
    }
    const opportunityEntityType = await this.entityTypeService.getOneEntityType(
      {
        where: { abbreviation: ENTITY_TYPES.IDEA },
      },
    );
    const votesByDateCountPromise = this.voteService.getVoteCountsByDate(
      opportunityEntityType.id,
      opportunityIds,
    );
    const shareByDateCountPromise = this.shareService.getShareCountsByDate(
      opportunityEntityType.id,
      opportunityIds,
    );
    const opportunitySubmissionByDateCountPromise = this.opportunityService.getOpportunityCountsByDate(
      opportunityIds,
    );
    const commentByDateCountPromise = this.commentService.getCommentCountsByDate(
      opportunityEntityType.id,
      opportunityIds,
    );
    const [
      votesByDateCount,
      shareByDateCount,
      opportunitySubmissionByDateCount,
      commentByDateCount,
    ] = await Promise.all([
      votesByDateCountPromise,
      shareByDateCountPromise,
      opportunitySubmissionByDateCountPromise,
      commentByDateCountPromise,
    ]);
    votesByDateCount.map(function(obj) {
      obj['type'] = 'votes';
    });
    shareByDateCount.map(function(obj) {
      obj['type'] = 'shares';
    });
    opportunitySubmissionByDateCount.map(function(obj) {
      obj['type'] = 'submissions';
    });
    commentByDateCount.map(function(obj) {
      obj['type'] = 'comments';
    });
    const prevMonthDates = UtilsService.getLastThirtyDates(1);
    const [voteCount, commentCount, shareCount] = [
      sumBy(votesByDateCount, 'count'),
      sumBy(commentByDateCount, 'count'),
      sumBy(shareByDateCount, 'count'),
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allDataForChart: any = [
      ...opportunitySubmissionByDateCount,
      ...commentByDateCount,
      ...votesByDateCount,
      ...shareByDateCount,
    ];
    allDataForChart = groupBy(allDataForChart, 'date');

    return {
      counts: {
        submissions: opportunityData.length,
        comments: commentCount,
        votes: voteCount,
        shares: shareCount,
        ratings: 0,
      },
      chartData: {
        ...allDataForChart,
        dateRanges: prevMonthDates,
      },
    };
  }
  async getCommunityGroupsTopEngagement(params: {
    community: number;
    challenge?: number;
  }): Promise<{}> {
    let opportunityIds;
    let entityType;
    if (params.challenge) {
      let where = {};
      where = { where, ...{ challenge: params.challenge } };
      const resultOpportunities = await this.opportunityService.getOpportunities(
        {
          where: where,
          select: ['id'],
        },
      );
      opportunityIds = map(resultOpportunities, 'id');
      entityType = await this.entityTypeService.getOneEntityType({
        where: { abbreviation: ENTITY_TYPES.IDEA },
      });
      if (!opportunityIds.length) {
        return [];
      }
    }
    const data = await this.userActionPointService.getUserActionPointsProcess({
      community: params.community,
      frequency: 'month',
      groupBy: USER_ACTION_POINT_FUNCTION_OPTIONS.GROUPS,
      entityObjectIds:
        opportunityIds && opportunityIds.length ? opportunityIds : '',
      entityObjectType:
        opportunityIds && opportunityIds.length && entityType
          ? entityType['id']
          : '',
    });
    return data;
  }
  async getCommunityUsersTopEngagement(params: {
    community: number;
    challenge?: number;
  }): Promise<{}> {
    let opportunityIds;
    let entityType;
    if (params.challenge) {
      let where = {};
      where = { where, ...{ challenge: params.challenge } };
      const resultOpportunities = await this.opportunityService.getOpportunities(
        {
          where: where,
          select: ['id'],
        },
      );
      opportunityIds = map(resultOpportunities, 'id');
      entityType = await this.entityTypeService.getOneEntityType({
        where: { abbreviation: ENTITY_TYPES.IDEA },
      });
      if (!opportunityIds.length) {
        return [];
      }
    }
    const data = await this.userActionPointService.getUserActionPointsProcess({
      community: params.community,
      frequency: 'month',
      entityObjectIds:
        opportunityIds && opportunityIds.length ? opportunityIds : '',
      entityObjectType:
        opportunityIds && opportunityIds.length && entityType
          ? entityType['id']
          : '',
    });
    return data;
  }
  async getCommunityTopEngagedLocations(params: {
    community: number;
    challenge?: number;
  }): Promise<{}> {
    let opportunityIds;
    let entityType;
    if (params.challenge) {
      let where = {};
      where = { where, ...{ challenge: params.challenge } };
      const resultOpportunities = await this.opportunityService.getOpportunities(
        {
          where: where,
          select: ['id'],
        },
      );
      opportunityIds = map(resultOpportunities, 'id');
      entityType = await this.entityTypeService.getOneEntityType({
        where: { abbreviation: ENTITY_TYPES.IDEA },
      });
      if (!opportunityIds.length) {
        return [];
      }
    }
    const data = await this.userActionPointService.getUserActionPointsProcess({
      community: params.community,
      frequency: 'month',
      groupBy: USER_ACTION_POINT_FUNCTION_OPTIONS.LOCATION,
      entityObjectIds:
        opportunityIds && opportunityIds.length ? opportunityIds : '',
      entityObjectType:
        opportunityIds && opportunityIds.length && entityType
          ? entityType['id']
          : '',
    });
    return data;
  }
  async getCommunityCounts(params: { community: number }): Promise<{}> {
    const option = {
      where: { community: params.community },
    };
    const [
      opportunities,
      challenges,
      shares,
      comments,
      votes,
    ] = await Promise.all([
      this.opportunityService.getOpportunityCount(option),
      this.challengeService.getChallengeCount(option),
      this.shareService.getShareCount(option),
      this.commentService.getCommentCount(option),
      this.voteService.getVoteCount(option),
    ]);
    return {
      opportunities,
      challenges,
      shares,
      comments,
      votes,
    };
  }
}
