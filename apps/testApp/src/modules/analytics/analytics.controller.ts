import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import {
  GetChallengeActorEngagementParams,
  GetChallengeActorEngagementQuery,
  GetCommunityActorEngagementParams,
  GetChallengeActivitySummaryParams,
  GetChallengeActivitySummaryQuery,
  GetCommunityGroupsTopEngagementParams,
  GetCommunityUsersTopEngagementParams,
  GetChallengeGroupsTopEngagementParams,
  GetChallengeGroupsTopEngagementQuery,
  GetChallengeUsersTopEngagementParams,
  GetChallengeUsersTopEngagementQuery,
  GetChallengeRegionsTopEngagementParams,
  GetChallengeRegionsTopEngagementQuery,
  GetCommunityRegionsTopEngagementParams,
} from './dto/AnalyticsDto';
import { SharedService } from '../../shared/services/shared.services';
import { Request } from 'express';
import * as _ from 'lodash';
import { OpportunityTypeService } from '../opportunityType/opportunityType.service';
import { UserService } from '../user/user.service';
import { CircleService } from '../circle/circle.service';
import { OpportunityService } from '../opportunity/opportunity.service';
import { UtilsService } from '../../providers/utils.service';
import * as moment from 'moment';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly sharedService: SharedService,
    private readonly opportunityTypeService: OpportunityTypeService,
    private readonly userService: UserService,
    private readonly circleService: CircleService,
    private readonly opportunityService: OpportunityService,
  ) {}

  @Get('challenge/:challenge/actor-engagement')
  async getChallengeActorEngagement(
    @Param() params: GetChallengeActorEngagementParams,
    @Query() queryParams: GetChallengeActorEngagementQuery,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getActorEngagement({
      challenge: params.challenge,
      community: queryParams.community,
    });
    return ResponseFormatService.responseOk(analytics, 'All');
  }

  @Get('challenge/:challenge/activity-summary')
  async getChallengeActivitySummary(
    @Param() params: GetChallengeActivitySummaryParams,
    @Query() queryParams: GetChallengeActivitySummaryQuery,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getActivitySummary({
      challenge: params.challenge,
      community: queryParams.community,
    });
    return ResponseFormatService.responseOk(analytics, 'All');
  }
  @Get('community/:community/activity-summary')
  async getCommunitySummary(
    @Param() params: GetCommunityActorEngagementParams,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getActivitySummary({
      community: params.community,
    });
    return ResponseFormatService.responseOk(analytics, 'All');
  }
  @Get('community/:community/groups/top-engagement')
  async getCommunityGroupsTopEngagement(
    @Param() params: GetCommunityGroupsTopEngagementParams,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getCommunityGroupsTopEngagement(
      {
        community: params.community,
      },
    );
    return ResponseFormatService.responseOk(analytics, 'All');
  }
  @Get('challenge/:challenge/groups/top-engagement')
  async getChallengeGroupsTopEngagement(
    @Param() params: GetChallengeGroupsTopEngagementParams,
    @Query() queryParams: GetChallengeGroupsTopEngagementQuery,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getCommunityGroupsTopEngagement(
      {
        challenge: params.challenge,
        community: queryParams.community,
      },
    );
    return ResponseFormatService.responseOk(analytics, 'All');
  }
  @Get('community/:community/users/top-engagement')
  async getCommunityUsersTopEngagement(
    @Param() params: GetCommunityUsersTopEngagementParams,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getCommunityUsersTopEngagement(
      {
        community: params.community,
      },
    );
    return ResponseFormatService.responseOk(analytics, 'All');
  }
  @Get('challenge/:challenge/users/top-engagement')
  async getChallengeUsersTopEngagement(
    @Param() params: GetChallengeUsersTopEngagementParams,
    @Query() queryParams: GetChallengeUsersTopEngagementQuery,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getCommunityUsersTopEngagement(
      {
        challenge: params.challenge,
        community: queryParams.community,
      },
    );
    return ResponseFormatService.responseOk(analytics, 'All');
  }
  @Get('community/:community/top-engagement-location')
  async getCommunityTopEngagedLocations(
    @Param() params: GetCommunityRegionsTopEngagementParams,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getCommunityTopEngagedLocations(
      {
        community: params.community,
      },
    );
    return ResponseFormatService.responseOk(analytics, 'All');
  }

  @Get('challenge/:challenge/top-engagement-location')
  async getChallengeTopEngagedLocations(
    @Param() params: GetChallengeRegionsTopEngagementParams,
    @Query() queryParams: GetChallengeRegionsTopEngagementQuery,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getCommunityTopEngagedLocations(
      {
        challenge: params.challenge,
        community: queryParams.community,
      },
    );
    return ResponseFormatService.responseOk(analytics, 'All');
  }

  @Get('community/:community/counts')
  async getCommunityCounts(
    @Param() params: GetCommunityRegionsTopEngagementParams,
  ): Promise<ResponseFormat> {
    const analytics = await this.analyticsService.getCommunityCounts({
      community: params.community,
    });
    return ResponseFormatService.responseOk(analytics, 'All');
  }

  @Post('dashboard/opportunities/pie')
  async getDashboardOpportunities(
    @Body() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    queryParams.opportunityFilter = {
      ...queryParams.opportunityFilter,
      community: req['userData'].currentCommunity,
    };
    const responseData = await this.sharedService.getAllOpportunities(
      queryParams.opportunityFilter,
      req,
      ['opportunityUsers'],
    );

    const graphData = [];
    if (
      queryParams.graphDataPoint &&
      queryParams.graphDataPoint === 'opportunityType'
    ) {
      const allTypes = await this.opportunityTypeService.getOpportunityTypes({
        community: req['userData'].currentCommunity,
      });
      const groupedTypes = _.groupBy(allTypes, 'id');
      const tempData = _.groupBy(responseData.data, 'opportunityTypeId');

      _.map(tempData, (val, key) => {
        graphData.push({
          title: _.head(groupedTypes[key]).name,
          count: val.length,
        });
      });
    } else if (
      queryParams.graphDataPoint &&
      queryParams.graphDataPoint === 'submitter'
    ) {
      const userData = await this.userService.getUsersWithCommunity(
        req['userData'].currentCommunity,
      );
      const groupedUserData = _.groupBy(userData, 'id');

      const tempData = _.groupBy(responseData.data, 'userId');
      _.map(tempData, (val, key) => {
        graphData.push({
          title:
            _.head(groupedUserData[key]).firstName +
            ' ' +
            _.head(groupedUserData[key]).lastName,
          count: val.length,
        });
      });
    } else if (
      queryParams.graphDataPoint &&
      queryParams.graphDataPoint === 'owner'
    ) {
      const userData = await this.userService.getUsersWithCommunity(
        req['userData'].currentCommunity,
      );
      const groupedUserData = _.groupBy(userData, 'id');

      const tempData = _.groupBy(responseData.data, 'userId');
      _.map(tempData, (val, key) => {
        graphData.push({
          title:
            _.head(groupedUserData[key]).firstName +
            ' ' +
            _.head(groupedUserData[key]).lastName,
          count: val.length,
        });
      });
    }
    return ResponseFormatService.responseOk(graphData, 'All');
  }
  @Get('dashboard/circle/pie')
  async getDashboardGroups(@Req() req: Request): Promise<ResponseFormat> {
    const responseData = await this.circleService.getCircles({
      relations: ['circleUsers'],
      where: { community: req['userData'].currentCommunity },
    });
    const graphData = [];
    _.map(responseData, (val, _key) => {
      graphData.push({
        title: val.name,
        count: val.circleUsers.length,
      });
    });
    return ResponseFormatService.responseOk(graphData, 'All');
  }
  @Post('dashboard/opportunities/time-series')
  async getDashboardOpportunityTimeSeries(
    @Body() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const responseData = await this.sharedService.getAllOpportunities(
      queryParams.opportunityFilter,
      req,
      ['opportunityUsers'],
    );
    const opportunityIds = _.map(responseData.data, 'id').toString();

    const graphData = {};
    if (queryParams.graphDataPoints.opportunityTypes) {
      graphData['opportunityTypes'] = {};
      const countData = await this.opportunityService.getDataForAnalyticsForTimeSeries(
        opportunityIds,
        req['userData'].currentCommunity,
        queryParams.graphDataPoints.opportunityTypes.toString(),
      );
      const allTypes = await this.opportunityTypeService.getOpportunityTypes({
        community: req['userData'].currentCommunity,
      });

      const groupedTypes = _.groupBy(allTypes, 'id');
      if (queryParams.spanType === 'daily') {
        graphData['opportunityTypes']['daily'] = [];
        _.map(countData.daily, (val, _key) => {
          graphData['opportunityTypes']['daily'].push({
            date: moment(val['date_trunc']).format('YYYY-MM-DD'),
            title: _.head(groupedTypes[val['opportunity_type_id']]).name,
            count: val['count'],
          });
        });
      }
      if (queryParams.spanType === 'weekly') {
        graphData['opportunityTypes']['weekly'] = [];
        _.map(countData.weekly, (val, _key) => {
          graphData['opportunityTypes']['weekly'].push({
            date: moment(val['date_trunc']).format('YYYY-MM-DD'),
            title: _.head(groupedTypes[val['opportunity_type_id']]).name,
            count: val['count'],
          });
        });
      }
      if (queryParams.spanType === 'monthly') {
        graphData['opportunityTypes']['monthly'] = [];
        _.map(countData.monthly, (val, _key) => {
          graphData['opportunityTypes']['monthly'].push({
            date: moment(val['date_trunc']).format('YYYY-MM-DD'),
            title: _.head(groupedTypes[val['opportunity_type_id']]).name,
            count: val['count'],
          });
        });
      }
    }
    const dateRange = UtilsService.getLastThirtyDates(3);

    return ResponseFormatService.responseOk({ graphData, dateRange }, 'All');
  }
}
