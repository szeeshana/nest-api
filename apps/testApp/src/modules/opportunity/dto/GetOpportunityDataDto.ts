'use strict';

import { IsOptional, IsArray, IsNotEmpty, IsInt } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetOpportunityDataBodyDto {
  @IsArray()
  @IsOptional()
  @ApiModelProperty()
  customFieldFilters;
}
export class GetOpportunityDataDetailBodyDto {
  @IsArray()
  @IsNotEmpty()
  @ApiModelProperty()
  opportunityIds;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @ApiModelProperty()
  community;
}
