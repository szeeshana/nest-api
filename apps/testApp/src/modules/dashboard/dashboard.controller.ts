import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  async addDashboard(@Body() body: {}): Promise<ResponseFormat> {
    const response = await this.dashboardService.addDashboard(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllDashboards(): Promise<ResponseFormat> {
    const options = {};
    const dashboards = await this.dashboardService.getDashboards(options);
    return ResponseFormatService.responseOk(dashboards, 'All');
  }

  @Get(':id')
  async getDashboard(@Param('id') id: string): Promise<ResponseFormat> {
    const dashboard = await this.dashboardService.getDashboards({ id: id });
    return ResponseFormatService.responseOk(dashboard, 'All');
  }

  @Patch(':id')
  async updateDashboard(
    @Param('id') id: string,
    @Body() body: {},
  ): Promise<ResponseFormat> {
    const updateData = await this.dashboardService.updateDashboard(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete(':id')
  async removeDashboard(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteData = await this.dashboardService.deleteDashboard({ id: id });
    return ResponseFormatService.responseOk(deleteData, '');
  }
}
