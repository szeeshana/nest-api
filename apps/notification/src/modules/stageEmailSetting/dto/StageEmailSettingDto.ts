'use strict';

import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StageEmailSettingDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  entityType: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  entityObjectId: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @ApiModelProperty()
  community: number;
}
