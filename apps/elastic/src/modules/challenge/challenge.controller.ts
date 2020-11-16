import { Controller, Logger } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { MessagePattern } from '@nestjs/microservices';
import { isEmpty } from 'lodash';

@Controller()
export class ChallengeController {
  private logger = new Logger('Notification controller');

  constructor(private readonly challengeService: ChallengeService) {}

  @MessagePattern('elastic-add-challenge-data')
  addChallengeData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-add-challenge-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-add-challenge-data');
    return this.challengeService.addChallengeData(data);
  }
  @MessagePattern('elastic-sync-challenge-data')
  syncChallengeData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-sync-challenge-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-add-challenge-data');
    return this.challengeService.syncChallengeData(data);
  }
  @MessagePattern('elastic-edit-challenge-data')
  editChallengeData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-edit-challenge-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-edit-challenge-data');
    return this.challengeService.editChallengeData(data);
  }
}
