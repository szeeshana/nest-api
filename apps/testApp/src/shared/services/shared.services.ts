import { Injectable } from '@nestjs/common';
import { Between, In } from 'typeorm';
import { OpportunityService } from '../../modules/opportunity/opportunity.service';
import * as _ from 'lodash';
import {
  CHALLENGE_SORTING,
  ENTITY_TYPES,
  TIME_LIMITS,
} from '../../common/constants/constants';
import { EntityMetaService } from './EntityMeta.service';
import { DefaultSort } from '../../enum/default-sort.enum';
import { CustomFieldDataService } from '../../modules/customField/customFieldData.service';
import { EntityExperienceSettingService } from '../../modules/entityExperienceSetting/entityExperienceSetting.service';

@Injectable()
export class SharedService {
  constructor(
    private readonly opportunityService: OpportunityService,
    public readonly customFieldDataService: CustomFieldDataService,
    public readonly entityExperienceSettingService: EntityExperienceSettingService,
  ) {}
  async getAllOpportunities(queryParams, req, relations?) {
    const options = {
      relations: relations ? relations : [],
      where: {},
      order: {},
      take: '',
      skip: '',
    };
    // Default pagination setting
    options.take = queryParams.take || 10;
    options.skip = queryParams.skip || 0;
    let filteredIds: any[];

    // Adding this for the mentioned filters [bookmarkedByMe,followedByMe,
    // votedFor,postedByMe] to extract Opportunity Ids to be passed in main
    // query before applying other filters to optimize data.
    if (
      queryParams.bookmarkedByMe ||
      queryParams.followedByMe ||
      queryParams.votedFor ||
      queryParams.postedByMe
    ) {
      filteredIds = await this.opportunityService.getOpportunityFilteredData({
        challenge: queryParams.challenge,
        community: queryParams.community,
        bookmarkedByMe: queryParams.bookmarkedByMe,
        followedByMe: queryParams.followedByMe,
        votedFor: queryParams.votedFor,
        postedByMe: queryParams.postedByMe,
        userData: req['userData'],
      });
      // Setting extracted filterIds from above function in queryParams object
      queryParams.id = [...(queryParams.id || []), ...filteredIds];
      if (!queryParams.id.length) {
        queryParams.id = [null];
      }
    }
    // Applying Custom-field filters condition
    if (queryParams.customFields && queryParams.customFields.length) {
      const updatedFilteredIds = await this.customFieldDataService.filterOpportunitiesByFieldData(
        {
          filters: queryParams.customFields,
          includedOpportunities: filteredIds,
          community: queryParams.community,
        },
      );
      // Replacing the selected Ids as it is filtered from the extracted `filterIds` variable while ignoring the fact if `filterIds` is empty or not !
      if (updatedFilteredIds.length) {
        queryParams.id = updatedFilteredIds;
      } else {
        queryParams.id = [null];
      }
    }
    // Verifying object type
    if (_.get(queryParams, 'id') && typeof queryParams.id === 'object') {
      queryParams.id = In(queryParams.id);
    }
    if (
      _.get(queryParams, 'opportunityTypes') &&
      typeof queryParams.opportunityTypes === 'object'
    ) {
      queryParams.opportunityType = In(queryParams.opportunityTypes);
    }

    if (queryParams.workflow == -1) {
      queryParams.workflow = null;
    }

    let filterStatuses: [] = [];
    if (
      _.get(queryParams, 'statuses') &&
      typeof queryParams.statuses === 'object'
    ) {
      filterStatuses = queryParams.statuses.map(status => parseInt(status));
      delete queryParams.statuses;
    }
    let filterTags: [] = [];
    if (_.get(queryParams, 'tags') && typeof queryParams.tags === 'object') {
      filterTags = queryParams.tags.map(tag => parseInt(tag));
      delete queryParams.tags;
    }

    options.where = {
      ...queryParams,
    };

    /* Date Filters */
    let dateFilter = {};
    // const groupedAllFollowersFinal = {};

    if (queryParams.fromDate || queryParams.toDate) {
      if (queryParams.fromDate && queryParams.toDate) {
        dateFilter = {
          createdAt: Between(
            queryParams.fromDate + ` ${TIME_LIMITS.START}`,
            queryParams.toDate + ` ${TIME_LIMITS.END}`,
          ),
        };
      } else {
        dateFilter = {
          createdAt: Between(
            queryParams.fromDate
              ? queryParams.fromDate + ` ${TIME_LIMITS.START}`
              : queryParams.toDate + ` ${TIME_LIMITS.START}`,
            queryParams.fromDate
              ? queryParams.fromDate + ` ${TIME_LIMITS.END}`
              : queryParams.toDate + ` ${TIME_LIMITS.END}`,
          ),
        };
      }
    }

    const sortClause = {};
    if (
      queryParams.sortBy &&
      queryParams.sortType &&
      queryParams.sortBy === 'createdAt'
    ) {
      sortClause[`opportunity.${queryParams.sortBy}`] = queryParams.sortType;
      options.order = {
        ...sortClause,
      };
    } else {
      if (queryParams.challenge) {
        // Finding followed challenges
        const challengeEntityType = await EntityMetaService.getEntityTypeMetaByAbbreviation(
          ENTITY_TYPES.CHALLENGE,
        );
        const experienceSettings = await this.entityExperienceSettingService.getEntityExperienceSetting(
          {
            where: {
              entityType: challengeEntityType.id,
              entityObjectId: queryParams.challenge,
              community: queryParams.community,
            },
          },
        );
        if (
          CHALLENGE_SORTING[experienceSettings.defaultSort] &&
          CHALLENGE_SORTING[experienceSettings.defaultSort].key
        ) {
          queryParams.sortBy =
            CHALLENGE_SORTING[experienceSettings.defaultSort].key;
          queryParams.sortType =
            CHALLENGE_SORTING[experienceSettings.defaultSort].type;

          if (
            experienceSettings.defaultSort === DefaultSort.NEWEST ||
            experienceSettings.defaultSort === DefaultSort.OLDEST
          ) {
            options.order = {
              ...sortClause,
              [queryParams.sortBy]: queryParams.sortType,
            };
          }
        } else {
          options.order = { ...sortClause, ['opportunity.id']: 'DESC' };
        }
      } else {
        sortClause['opportunity.createdAt'] = 'DESC';
        options.order = {
          ...sortClause,
        };
      }
    }
    options.where = { ...options.where, ...dateFilter };

    /* Date Filters */

    delete options.where['take'];
    delete options.where['skip'];

    let resultOpportunities = await this.opportunityService.searchOpportunitiesWithCountOptimize(
      {
        mainTableWhereFilters: options.where,
        // take: parseInt(options.take),
        // skip: parseInt(options.skip),
        orderBy: options.order,
        statuses: filterStatuses,
        tags: filterTags,
        // opportunityIds: filteredOpportunityIds,
      },
    );

    // TODO: Uncomment permissions check after optimization permissions for
    // bulk data.
    // const promiseArray = [];

    // _.map(opportunities, (val: OpportunityEntity) => {
    //   promiseArray.push(
    //     this.opportunityService.getOpportunityPermissions(
    //       val.id,
    //       req['userData'].id,
    //       true,
    //     ),
    //   );
    // });
    // const res = await Promise.all(promiseArray);
    // const resGrouped = _.groupBy(res, 'opportunityId');
    // _.map(opportunities, (valOpp, keyOpp) => {
    //   if (
    //     _.head(resGrouped[valOpp.id.toString()]).permissions.viewOpportunity ===
    //     PERMISSIONS_MAP.DENY
    //   ) {
    //     delete opportunities[keyOpp];
    //   }
    // });
    // let resultOpportunities = _.compact(opportunities);
    // ---

    let opportunityIds = [];
    if (resultOpportunities.length) {
      opportunityIds = _.map(resultOpportunities, 'id');
    }
    // ---
    if (
      queryParams.sortBy &&
      queryParams.sortType &&
      (queryParams.sortBy === 'comment' || queryParams.sortBy === 'vote') &&
      opportunityIds.length
    ) {
      const [commentCount, voteCount] = await Promise.all([
        this.opportunityService.getCommentCount(opportunityIds),
        this.opportunityService.getVoteCount(opportunityIds),
      ]);
      const commentCountTemp = _.groupBy(commentCount, 'opportunity_id');
      const voteCountTemp = _.groupBy(voteCount, 'opportunity_id');

      for (const iterator of resultOpportunities) {
        iterator['comment'] = commentCountTemp[iterator.id][0]['comment'];
        iterator['vote'] = voteCountTemp[iterator['id']][0]['vote'];
      }
      const dataSorted = _.orderBy(
        resultOpportunities,
        [queryParams.sortBy],
        [queryParams.sortType.toLowerCase()],
      );
      resultOpportunities = dataSorted;
    }

    const paginatedData = resultOpportunities.slice(
      parseInt(options.skip),
      parseInt(options.skip) + parseInt(options.take),
    );

    return {
      data: paginatedData,
      count: resultOpportunities.length,
    };
  }
}
