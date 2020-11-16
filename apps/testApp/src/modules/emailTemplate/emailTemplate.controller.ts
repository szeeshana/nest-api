import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  Param,
  Body,
  Patch,
  Post,
} from '@nestjs/common';
import { EmailTemplateService } from './emailTemplate.service';
import { Request } from 'express';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { EditEmailTemplateDto, TestEmailTemplateDto } from './dto/';
import { MailService } from '../../shared/services/mailer.service';
import { TEST_EMAIL } from '../../common/constants/constants';

@Controller('email-templates')
export class EmailTemplatesController {
  private looger = new Logger('Notification Controller');
  constructor(
    private emailTemplateService: EmailTemplateService,
    public readonly mailService: MailService,
  ) {}

  @Get()
  /**
   * Get community all templates
   * @param {Object} query, req
   * @return List of community template
   */
  async getCommunityEmailTemplates(
    @Query() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    this.looger.log('Get all community templates', req['userData'].id);
    const activityData = await this.emailTemplateService.getCommunityEmailTemplates(
      {
        userId: req['userData'].id,
        community: queryParams.community,
      },
    );
    return ResponseFormatService.responseOk(activityData, '');
  }

  @Post('test-email')
  async testEmailTemplate(
    @Body() body: TestEmailTemplateDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    let emailTemplate = TEST_EMAIL;
    emailTemplate = emailTemplate.replace('{{body}}', body.body);
    emailTemplate = emailTemplate.replace(
      '{{featureImage}}',
      body.featureImage,
    );
    emailTemplate = emailTemplate.replace('{{footer}}', body.footerSection);

    await this.mailService.sendEmail(
      req['userData'].email,
      '',
      emailTemplate,
      body.subject,
    );
    return ResponseFormatService.responseOk([], 'Email Sent Successfully');
  }

  @Patch(':templateId/:communityId')
  async readNotifications(
    @Param('communityId') communityId,
    @Param('templateId') templateId,
    @Req() req,
    @Body() body: EditEmailTemplateDto,
  ): Promise<ResponseFormat> {
    const templateParams = {
      params: {
        community: communityId,
        id: templateId,
        userId: req['userData'].id,
      },
      data: body,
    };
    const updatedEmailTemplate = await this.emailTemplateService.updateCommunityEmailTemplate(
      templateParams,
    );
    return ResponseFormatService.responseOk(updatedEmailTemplate, '');
  }
}
