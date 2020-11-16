'use strict';

import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsBooleanString,
  IsEnum,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ChallengeStatuses } from '../../../enum/cahllenge-status.enum';

export class GetChallengeDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @ApiModelProperty()
  community: number;

  @IsBooleanString()
  @IsOptional()
  @ApiModelProperty()
  isDeleted: boolean;

  @IsEnum(ChallengeStatuses)
  @IsOptional()
  @ApiModelProperty()
  status: string;
}
