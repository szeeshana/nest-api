import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { ActionItemService } from './actionItem.service';
import { ActionItemLogService } from './actionItemLog.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { ResponseFormatService } from '../../shared/services/response-format.service';

@Controller('action-item')
export class ActionItemController {
  constructor(
    private readonly actionItemService: ActionItemService,
    private actionItemLogService: ActionItemLogService,
  ) {}

  @Post()
  async addActionItem(@Body() body: {}): Promise<ResponseFormat> {
    const response = await this.actionItemService.addActionItem(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllActionItems(): Promise<ResponseFormat> {
    const actionItems = await this.actionItemService.getActionItems({
      where: { isDeleted: false },
      order: { id: 'ASC' },
    });
    return ResponseFormatService.responseOk(actionItems, 'All');
  }

  @Get('notifications')
  async searchAllActionItemNotifications(
    @Query() queryParams,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const actionItemLogData = await this.actionItemLogService.searchActionItemLogs(
      {
        options: {
          entityObjectId: queryParams.entityObjectId,
          entityTypeName: queryParams.entityTypeName,
          community: queryParams.community,
          userId: req['userData'].id,
          actionItemAbbreviation: queryParams.actionItemAbbreviation,
          take: queryParams.take,
          skip: queryParams.skip,
          orderBy: queryParams.orderBy,
          orderType: queryParams.orderType,
          isNotification: true,
        },
      },
    );
    return ResponseFormatService.responseOk(actionItemLogData, '');
  }

  @Get(':id')
  async getActionItem(@Param('id') id: string): Promise<ResponseFormat> {
    const actionItem = await this.actionItemService.getActionItems({ id: id });
    return ResponseFormatService.responseOk(actionItem, 'All');
  }

  @Patch('notifications/mark-read')
  async readNotifications(@Body() body): Promise<ResponseFormat> {
    const actionItemLogData = await this.actionItemLogService.updateReadStatus(
      body,
    );
    return ResponseFormatService.responseOk(actionItemLogData, '');
  }

  @Patch(':id')
  async updateActionItem(
    @Param('id') id: string,
    @Body() body: {},
  ): Promise<ResponseFormat> {
    const updateData = await this.actionItemService.updateActionItem(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete(':id')
  async removeActionItem(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteData = await this.actionItemService.deleteActionItem({
      id: id,
    });
    return ResponseFormatService.responseOk(deleteData, '');
  }
}
