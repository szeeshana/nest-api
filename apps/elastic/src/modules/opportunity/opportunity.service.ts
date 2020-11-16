import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { differenceWith, forEach, head, map } from 'lodash';
import { INDEXES } from '../../common/constants';
import {
  OpportunityInterface,
  SearchResultInterface,
} from '../../common/interfaces';
// import { AddOpportunityDto } from './dto';
@Injectable()
export class OpportunityService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}
  async addOpportunityData(data: OpportunityInterface): Promise<{}> {
    Logger.log('Elastic Opportunity Data Insertion');
    return this.elasticsearchService.index<
      SearchResultInterface,
      OpportunityInterface
    >({
      index: INDEXES.OPPORTUNITY,
      body: {
        id: data.id,
        title: data.title,
        description: data.description,
        community: data.community,
        communityId: data.communityId,
        isDeleted: data.isDeleted,

        oppNumber: data.id,
      },
    });
  }
  async syncOpportunityData(data: OpportunityInterface[]): Promise<void> {
    Logger.log('Elastic Opportunity Data Syncing');
    const indexExists = await this.elasticsearchService.indices.exists({
      index: INDEXES.OPPORTUNITY,
    });
    const finalOpportunities = [];
    if (indexExists.statusCode === 200) {
      const promArr = [];
      map(data, val => {
        promArr.push(
          this.elasticsearchService.search<SearchResultInterface>({
            index: INDEXES.OPPORTUNITY,
            body: {
              query: {
                match: { id: val.id },
              },
            },
          }),
        );
      });
      const allData: SearchResultInterface[] = await Promise.all(promArr);

      allData.map(item => {
        forEach(head(item['body']['hits']['hits']), (val, key: string) => {
          if (key == '_source') {
            finalOpportunities.push(val);
          }
        });
      });
    }

    const result = differenceWith(
      data,
      finalOpportunities,
      (x, y) => x.id == y.id,
    );
    const tableData = [
      {
        text: 'Opportunity Index Status',
        value: indexExists.statusCode,
      },
      { text: 'Requested Opportunities', value: data.length },
      {
        text: 'Already Exist Opportunities In Elastic Search',
        value: finalOpportunities.length,
      },
      {
        text: 'To be added Opportunities In Elastic Search',
        value: result.length,
      },
    ];

    // eslint-disable-next-line no-console
    console.table(tableData);

    for (const iterator of result) {
      this.elasticsearchService.index<
        SearchResultInterface,
        OpportunityInterface
      >({
        index: INDEXES.OPPORTUNITY,
        body: {
          id: iterator.id,
          title: iterator.title,
          description: iterator.description,
          community: iterator.community,
          communityId: iterator.communityId,
          isDeleted: iterator.isDeleted,
          oppNumber: iterator.id,
        },
      });
    }
  }
  async editOpportunityData(data: OpportunityInterface): Promise<{}> {
    Logger.log('Elastic Opportunity Data Update');
    const script = Object.entries(data).reduce((result, [key, value]) => {
      return `${result} ctx._source.${key}='${value}';`;
    }, '');
    return this.elasticsearchService.updateByQuery({
      index: INDEXES.OPPORTUNITY,
      body: {
        query: {
          match: {
            id: data.id,
          },
        },
        script: {
          inline: script,
        },
      },
    });
  }
}
