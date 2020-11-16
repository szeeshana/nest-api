/* eslint-disable @typescript-eslint/camelcase */
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  ChallengeInterface,
  OpportunityInterface,
  SearchResultInterface,
  UserInterface,
} from '../../common/interfaces';

@Injectable()
export class OmnisearchService {
  private logger = new Logger('Elastic - Omnisearch service');

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Perform search in ElasticSearch indices based on the given parameters.
   * @param data Params to perform search for.
   */
  async performSearch(data: {
    query: string;
    community: number;
    isDeleted: boolean;
    index: string[];
    fields: string[];
    includeOppId: boolean;
  }): Promise<{
    total: number;
    results: Array<{
      index: string;
      result: OpportunityInterface | ChallengeInterface | UserInterface;
    }>;
  }> {
    try {
      let total = 0;
      let results = [];

      // Filtering out the indices that exist in the elastic search.
      const existingIndices = [];
      const indexStatuses = await Promise.all(
        data.index.map(index =>
          this.elasticsearchService.indices.exists({
            index,
          }),
        ),
      );
      indexStatuses.forEach((status, i) => {
        if (status.body) {
          existingIndices.push(data.index[i]);
        }
      });

      // Searching on the existing indices.
      if (existingIndices.length) {
        const { body } = await this.elasticsearchService.search<
          SearchResultInterface
        >({
          index: existingIndices,
          body: {
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      should: [
                        {
                          multi_match: {
                            query: data.query,
                            fields: data.fields,
                            lenient: true,
                            fuzziness: 'AUTO',
                          },
                        },
                        ...(data.includeOppId
                          ? [
                              {
                                match: {
                                  oppNumber: {
                                    query: data.query,
                                    lenient: true,
                                  },
                                },
                              },
                            ]
                          : []),
                      ],
                      minimum_should_match: 1,
                    },
                  },
                  {
                    match: {
                      communityId: data.community,
                    },
                  },
                  {
                    match: {
                      isDeleted: data.isDeleted,
                    },
                  },
                ],
              },
            },
          },
        });
        results = body.hits.hits.map(item => ({
          index: item._index,
          result: item._source,
        }));
        total = body.hits.total.value;
      }

      return {
        total,
        results,
      };
    } catch (error) {
      this.logger.log('EROR In Omnisearch Service: ' + JSON.stringify(error));
      throw error;
    }
  }
}
