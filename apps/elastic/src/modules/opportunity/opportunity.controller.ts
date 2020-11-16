import { Controller, Logger } from '@nestjs/common';
import { OpportunityService } from './opportunity.service';
import { MessagePattern } from '@nestjs/microservices';
import { isEmpty } from 'lodash';

@Controller()
export class OpportunityController {
  private logger = new Logger('Notification controller');

  constructor(private readonly opportunityService: OpportunityService) {}

  @MessagePattern('elastic-add-opportunity-data')
  addOpportunityData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-add-user-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-add-opportunity-data');
    return this.opportunityService.addOpportunityData(data);
  }
  @MessagePattern('elastic-sync-opportunity-data')
  syncOpportunityData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-sync-opportunity-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-sync-opportunity-data');
    return this.opportunityService.syncOpportunityData(data);
  }
  @MessagePattern('elastic-edit-opportunity-data')
  editOpportunityData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-edit-opportunity-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-edit-opportunity-data');
    return this.opportunityService.editOpportunityData(data);
  }
}
