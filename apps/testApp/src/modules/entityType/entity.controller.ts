import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { EntityTypeService } from './entity.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import * as _ from 'lodash';

@Controller('entity')
export class EntityTypeController {
  constructor(public entityService: EntityTypeService) {}

  @Post()
  async addEntityType(@Body() body: {}): Promise<ResponseFormat> {
    const response = await this.entityService.addEntityType(body);
    return ResponseFormatService.responseOk(
      response,
      'EntityType Added Successfully',
    );
  }

  @Get()
  async getAllEntityTypes(@Query() queryParams): Promise<ResponseFormat> {
    const options = {
      where: queryParams,
    };
    const response = await this.entityService.getEntityTypes(options);
    return ResponseFormatService.responseOk(response, 'All');
  }

  @Get(':id')
  async getEntityType(@Param('id') id: string): Promise<ResponseFormat> {
    const response = await this.entityService.getEntityTypes({
      id: id,
    });
    return ResponseFormatService.responseOk(response, 'All');
  }

  @Patch(':id')
  async updateEntityType(
    @Param('id') id: string,
    @Body() body: {},
  ): Promise<ResponseFormat> {
    const updateData = await this.entityService.updateEntityType(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete(':id')
  async removeEntityType(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteData = await this.entityService.deleteEntityType({
      id: id,
    });
    return ResponseFormatService.responseOk(deleteData, '');
  }
}
