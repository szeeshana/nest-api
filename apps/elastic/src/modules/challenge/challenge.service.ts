import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { differenceWith, forEach, head, map } from 'lodash';
import { INDEXES } from '../../common/constants';
import {
  ChallengeInterface,
  SearchResultInterface,
} from '../../common/interfaces';
// import { AddChallengeDto } from './dto';

@Injectable()
export class ChallengeService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}
  async addChallengeData(data: ChallengeInterface): Promise<{}> {
    Logger.log('Elastic Challenge Data Insertion');
    return this.elasticsearchService.index<
      SearchResultInterface,
      ChallengeInterface
    >({
      index: INDEXES.CHALLENGE,
      body: {
        id: data.id,
        title: data.title,
        description: data.description,
        additionalBrief: data.additionalBrief,
        communityId: data.communityId,
        isDeleted: data.isDeleted,
      },
    });
  }
  async syncChallengeData(data: ChallengeInterface[]): Promise<void> {
    Logger.log('--------Elastic Challenge Data Syncing-------');
    const indexExists = await this.elasticsearchService.indices.exists({
      index: INDEXES.CHALLENGE,
    });

    const finalChallenges = [];
    if (indexExists.statusCode === 200) {
      const promArr = [];
      map(data, val => {
        promArr.push(
          this.elasticsearchService.search<SearchResultInterface>({
            index: INDEXES.CHALLENGE,
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
            finalChallenges.push(val);
          }
        });
      });
    }

    const result = differenceWith(
      data,
      finalChallenges,
      (x, y) => x.id == y.id,
    );

    const tableData = [
      {
        text: 'Challenge Index Status',
        value: indexExists.statusCode,
      },
      { text: 'Requested Challenges', value: data.length },
      {
        text: 'Already Exist Challenges In Elastic Search',
        value: finalChallenges.length,
      },
      {
        text: 'To be added Challenges In Elastic Search',
        value: result.length,
      },
    ];

    // eslint-disable-next-line no-console
    console.table(tableData);
    for (const iterator of result) {
      this.elasticsearchService.index<
        SearchResultInterface,
        ChallengeInterface
      >({
        index: INDEXES.CHALLENGE,
        body: {
          id: iterator.id,
          title: iterator.title,
          description: iterator.description,
          additionalBrief: iterator.additionalBrief,
          communityId: iterator.communityId,
          isDeleted: iterator.isDeleted,
        },
      });
    }
  }
  async editChallengeData(data: ChallengeInterface): Promise<{}> {
    Logger.log('Elastic Challenge Data Update');
    const script = Object.entries(data).reduce((result, [key, value]) => {
      return `${result} ctx._source.${key}='${value}';`;
    }, '');
    return this.elasticsearchService.updateByQuery({
      index: INDEXES.CHALLENGE,
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
