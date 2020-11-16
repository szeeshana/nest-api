import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { differenceWith, forEach, head, map } from 'lodash';
import { INDEXES } from '../../common/constants';
import { UserInterface, SearchResultInterface } from '../../common/interfaces';
// import { AddOpportunityDto } from './dto';
@Injectable()
export class UserService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}
  async addUserData(data: UserInterface): Promise<{}> {
    Logger.log('Elastic User Data Insertion');
    return this.elasticsearchService.index<
      SearchResultInterface,
      UserInterface
    >({
      index: INDEXES.USER,
      body: {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        email: data.email,
        secondaryEmail: data.secondaryEmail,
        profileBio: data.profileBio,
        skills: data.skills,
        region: data.region,
        country: data.country,
        city: data.city,
        zipCode: data.zipCode,
        timeZone: data.timeZone,
        latLng: data.latLng,
        position: data.position,
        company: data.company,
        communityId: data.communityId,
        isDeleted: data.isDeleted,
      },
    });
  }
  async syncUserData(data: UserInterface[]): Promise<void> {
    Logger.log('Elastic User Data Syncing');
    const indexExists = await this.elasticsearchService.indices.exists({
      index: INDEXES.USER,
    });
    const finalUsers = [];
    let promArr = [];
    if (indexExists.statusCode === 200) {
      promArr = map(data, val => {
        return this.elasticsearchService.search<SearchResultInterface>({
          index: INDEXES.USER,
          body: {
            query: {
              match: { id: val.id },
            },
          },
        });
      });
      const allData: SearchResultInterface[] = await Promise.all(promArr);

      allData.map(item => {
        forEach(head(item['body']['hits']['hits']), (val, key: string) => {
          if (key == '_source') {
            finalUsers.push(val);
          }
        });
      });
    }

    const result = differenceWith(
      data,
      finalUsers,
      (x, y) => x.id !== y.id && x.communityId !== y.communityId,
    );
    const tableData = [
      {
        text: 'User Index Status',
        value: indexExists.statusCode,
      },
      { text: 'Requested Users', value: data.length },
      {
        text: 'Already Exist Users In Elastic Search',
        value: finalUsers.length,
      },
      {
        text: 'To be added Users In Elastic Search',
        value: result.length,
      },
    ];

    // eslint-disable-next-line no-console
    console.table(tableData);
    for (const iterator of result) {
      this.elasticsearchService.index<SearchResultInterface, UserInterface>({
        index: INDEXES.USER,
        body: iterator,
      });
    }
  }
  async editUserData(data: UserInterface): Promise<{}> {
    Logger.log('Elastic User Data Update');
    const script = Object.entries(data).reduce((result, [key, value]) => {
      return `${result} ctx._source.${key}='${value}';`;
    }, '');

    return this.elasticsearchService.updateByQuery({
      index: INDEXES.USER,
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
