'use strict';

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsInt,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EditOpportunityTypeDto {
  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  icon: string;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  color: string;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  abbreviation: string;

  @IsBoolean()
  @IsOptional()
  @ApiModelProperty()
  isEnabled: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiModelProperty()
  isDeleted: boolean;

  @IsNumber()
  @IsOptional()
  @ApiModelProperty()
  postingExperience: number;

  @IsArray()
  @IsOptional()
  @ApiModelProperty()
  opportunityTypeFields: [];

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @ApiModelProperty()
  workflow: number;
}
