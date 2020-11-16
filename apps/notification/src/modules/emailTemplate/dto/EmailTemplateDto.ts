'use strict';

import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class EmailTemplateDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiModelProperty()
  readonly community;
}
