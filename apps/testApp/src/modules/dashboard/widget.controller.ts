import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';

import { WidgetService } from './widget.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';

@Controller('widget')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Post()
  async addWidget(@Body() body: {}): Promise<ResponseFormat> {
    const response = await this.widgetService.addWidget(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllWidgets(@Query() queryParams): Promise<ResponseFormat> {
    const options = {
      ...queryParams,
      order: {
        createdAt: 'DESC',
      },
    };

    const widgets = await this.widgetService.getWidgets(options);
    return ResponseFormatService.responseOk(widgets, 'All Widgets');
  }

  @Get(':id')
  async getWidget(@Param('id') id: string): Promise<ResponseFormat> {
    const widget = await this.widgetService.getWidgets({ id: id });
    return ResponseFormatService.responseOk(widget, 'All');
  }

  @Patch(':id')
  async updateWidget(
    @Param('id') id: string,
    @Body() body: {},
  ): Promise<ResponseFormat> {
    const updateData = await this.widgetService.updateWidget({ id: id }, body);
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete(':id')
  async removeWidget(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteData = await this.widgetService.deleteWidget({ id: id });
    return ResponseFormatService.responseOk(deleteData, '');
  }
}
