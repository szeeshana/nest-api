'use strict';

import { IsString, IsOptional } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class RefreshTokenBodyDto {
  @IsString()
  @IsOptional()
  @ApiModelProperty()
  refreshToken: string;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  grantType: string;
}
