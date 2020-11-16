'use strict';

import { IsOptional, IsBooleanString, IsString, IsInt } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetCommunityUsersDto {
  @IsString()
  @IsOptional()
  @ApiModelProperty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @ApiModelProperty()
  excludedCircleId: number;

  @IsBooleanString()
  @IsOptional()
  @ApiModelProperty()
  isDeleted: boolean;
}
