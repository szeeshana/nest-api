'use strict';

import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  query: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @ApiModelProperty()
  community: number;

  @IsBoolean()
  @IsNotEmpty()
  @ApiModelProperty()
  isDeleted: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiModelProperty()
  index: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiModelProperty()
  fields: string[];

  @IsBoolean()
  @IsOptional()
  @ApiModelProperty()
  includeOppId: boolean;
}
