import { ExceptionFilter } from './../../filters/rpcException.filter';
import { Controller, Logger, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import * as _ from 'lodash';
import * as moment from 'moment';
import 'moment-timezone';
import { EmailTemplateService } from './emailTemplate.service';
import { EmailTemplateDto } from './dto';
import { DefaultEmailTemplateService } from '../defaultEmailTemplate/defaultEmailTemplate.service';

@Controller()
export class EmailTemplateController {
  private logger = new Logger('EmailTemplatesController');
  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    private readonly defaultEmailTemplateService: DefaultEmailTemplateService,
  ) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('addEmailTemplatesForCommunity')
  /**
   * Add Default Community Template When Community Register
   * @param {Object} data to get community from demoTestApp app
   */
  async addCommunityEmailTemplates(data: EmailTemplateDto): Promise<{}> {
    const defaultTemplateData = await this.defaultEmailTemplateService.getDefaultEmailTemplates(
      { relations: ['actionType'] },
    );
    _.map(defaultTemplateData, val => {
      val['community'] = data.community;
      val['isDeleted'] = false;
      delete val['id'];
      delete val['createdAt'];
      delete val['updatedAt'];
      delete val['updatedBy'];
      delete val['createdBy'];
    });
    const addedEmailTemplate = await this.emailTemplateService.addEmailTemplate(
      defaultTemplateData,
    );
    this.logger.log('Email Template added successfuly against community');
    return addedEmailTemplate;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('getEmailTemplateForCommunity')
  /**
   * Get community email templates
   * @param {Object} data to get community from demoTestApp app
   */
  getCommuintyEmailTemplate(dataParams: {}): Promise<{}> {
    this.logger.log('Get Community Email Templates');
    return this.emailTemplateService.getEmailTemplates({
      where: dataParams,
    });
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('updateCommunityEmailTemplate')
  /**
   * update community email templates
   * @param {Object} data patched data object
   * @param {Object} params community id, template id
   * @return Updated list of template
   */
  updateCommunityEmailTemplate(data: { params: {}; data: {} }): Promise<{}> {
    this.logger.log('Update Community Email Template');
    // const currentTime = moment().utc();
    const nextRun = moment()
      .set(_.get(data, 'data.runAt', {}))
      .tz(_.get(data, 'data.timeZone', ''))
      .utc()
      .format();
    /* if(moment(nextRun).isBefore(currentTime)) {
        nextRun = moment().set(_.get(data,'data.runAt',{})).add(1, 'day').tz(_.get(data,'data.timeZone','')).utc().format();
    } */
    data.data['nextRun'] = nextRun;
    return this.emailTemplateService.updateEmailTemplate(
      data.params,
      data.data,
    );
  }
}
