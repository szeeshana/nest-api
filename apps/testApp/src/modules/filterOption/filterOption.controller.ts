import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Req,
  Put,
} from '@nestjs/common';

import { FilterOptionService } from './filterOption.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { GetFilterOptionsDto } from './dto/GetFilterOptionsDto';
import { Request } from 'express';
import { PutFilterOptionDto } from './dto/PutFilterOptionDto';

@Controller('filter-option')
export class FilterOptionController {
  constructor(private readonly filterOptionService: FilterOptionService) {}

  @Post()
  async addFilterOption(
    @Body() body: PutFilterOptionDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const response = await this.filterOptionService.addFilterOption({
      ...body,
      user: req['userData'].id,
    });
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllFilterOptions(
    @Query() queryParams: GetFilterOptionsDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const filterOptions = await this.filterOptionService.getFilterOptions({
      where: {
        ...queryParams,
        user: req['userData'].id,
      },
    });
    return ResponseFormatService.responseOk(filterOptions, 'Filter Options');
  }

  @Get(':id')
  async getFilterOption(@Param('id') id: string): Promise<ResponseFormat> {
    const filterOption = await this.filterOptionService.getFilterOptions({
      where: { id: id },
    });
    return ResponseFormatService.responseOk(filterOption, 'All');
  }

  @Put()
  async addOrUpdateFilterOption(
    @Body() body: PutFilterOptionDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const updateData = await this.filterOptionService.addOrUpdateFilterOption({
      ...body,
      user: req['userData'].id,
    });
    return ResponseFormatService.responseOk(
      updateData,
      updateData['affected'] ? 'Updated' : 'Created',
    );
  }
}
