import { ExceptionFilter } from './../../filters/rpcException.filter';
import { Controller, Logger, UseFilters } from '@nestjs/common';
import { ActionTypeService } from './actionType.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class ActionTypeController {
  private logger = new Logger('Notification controller');

  constructor(private readonly actionTypeService: ActionTypeService) {}
  @UseFilters(new ExceptionFilter())
  @MessagePattern('getActionTypes')
  async getActionTypes(queryParams: {}): Promise<{}> {
    this.logger.log(queryParams, 'Msg Dispatch From Notification Service');
    const actionTypes = await this.actionTypeService.getActionTypes({
      where: queryParams,
    });
    return actionTypes;
  }
}
