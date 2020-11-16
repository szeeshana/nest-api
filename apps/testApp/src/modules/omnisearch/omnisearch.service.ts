import { Injectable } from '@nestjs/common';
import { head, uniqBy } from 'lodash';
import { In } from 'typeorm';
import { INDEXES } from '../../common/constants/constants';
import { SearchResultTypeEnum } from '../../enum';
import { ElasticSearchService } from '../../shared/services/elasticSearchHook';
import { ChallengeService } from '../challenge/challenge.service';
import { OpportunityService } from '../opportunity/opportunity.service';
import { UserService } from '../user/user.service';
import { SearchResponseInterface } from './interfaces';

@Injectable()
export class OmnisearchService {
  constructor(
    public readonly elasticSearchService: ElasticSearchService,
    public readonly opportunityService: OpportunityService,
    public readonly challengeService: ChallengeService,
    public readonly userService: UserService,
  ) {}

  /**
   * Perform Search accross entities.
   * @param params Search Params (including search query, community and others).
   */
  async search(params: {
    query: string;
    community: number;
  }): Promise<SearchResponseInterface> {
    const rawResults = await this.elasticSearchService.search({
      query: params.query,
      community: params.community,
      isDeleted: false,
      index: [INDEXES.OPPORTUNITY, INDEXES.CHALLENGE, INDEXES.USER],
      fields: ['title', 'description', 'additionalBrief', '*Name', 'email'],
      includeOppId: true,
    });

    const searchResults = uniqBy(rawResults.results, res =>
      [res.index, res.result['id']].join(),
    );

    const [opportunityRes, challengeRes, userRes] = [
      this.filterResults(searchResults, SearchResultTypeEnum.OPPORTUNITY),
      this.filterResults(searchResults, SearchResultTypeEnum.CHALLENGE),
      this.filterResults(searchResults, SearchResultTypeEnum.USER),
    ];

    //TODO: Implement Permissions here.

    const [opportunities, challenges, users] = await Promise.all([
      opportunityRes.length
        ? this.opportunityService.getSimpleOpportunities({
            where: {
              id: In(opportunityRes.map(res => res.result['id'])),
              community: params.community,
            },
            relations: ['opportunityType', 'opportunityAttachments'],
          })
        : [],
      challengeRes.length
        ? this.challengeService.getChallenges({
            where: {
              id: In(challengeRes.map(res => res.result['id'])),
              community: params.community,
            },
            relations: ['opportunityType'],
          })
        : [],
      userRes.length
        ? this.userService.getUsers({
            where: {
              id: In(userRes.map(res => res.result['id'])),
              community: params.community,
            },
            relations: ['profileImage'],
          })
        : [],
    ]);

    const finalResults = searchResults.map(result => {
      const res = { type: undefined, data: undefined };
      if (result.index === SearchResultTypeEnum.OPPORTUNITY) {
        res.type = SearchResultTypeEnum.OPPORTUNITY;
        res.data = head(
          opportunities.filter(opp => opp.id == result.result['id']),
        );
      } else if (result.index === SearchResultTypeEnum.CHALLENGE) {
        res.type = SearchResultTypeEnum.CHALLENGE;
        res.data = head(
          challenges.filter(challenge => challenge.id == result.result['id']),
        );
      } else if (result.index === SearchResultTypeEnum.USER) {
        res.type = SearchResultTypeEnum.USER;
        res.data = head(users.filter(user => user.id == result.result['id']));
      }
      return res;
    });

    return {
      results: finalResults,
      count: finalResults.length,
    };
  }

  /**
   * Filter search results for a given index.
   * @param searchResults Search Results to filter from.
   * @param filterIndex Index for which results need to be filtered.
   */
  private filterResults(
    searchResults: Array<{ index: string; result: {} }>,
    filterIndex: SearchResultTypeEnum,
  ): Array<{ index: string; result: {} }> {
    const filteredRes = searchResults.filter(res => res.index === filterIndex);
    return uniqBy(filteredRes, 'result.id');
  }
}
