import { ExceptionFilter } from './../../filters/rpcException.filter';
import { Controller, Logger, UseFilters } from '@nestjs/common';
import { DefaultEmailTemplateService } from './defaultEmailTemplate.service';
import { MessagePattern } from '@nestjs/microservices';
@Controller()
export class DefaultEmailTemplateController {
  private logger = new Logger('Notification controller');

  constructor(
    private readonly defaultEmailTemplateService: DefaultEmailTemplateService,
  ) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('getDefaultEmailTemplates')
  async getDefaultEmailTemplates(queryParams: {}): Promise<{}> {
    this.logger.log(queryParams, 'Msg Dispatch From Notification Service');
    const defaultEmailTemplates = await this.defaultEmailTemplateService.getDefaultEmailTemplates(
      {
        where: queryParams,
      },
    );
    return defaultEmailTemplates;
  }
}
