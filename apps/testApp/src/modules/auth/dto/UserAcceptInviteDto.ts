'use strict';

import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UserAcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  readonly firstName;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  readonly lastName;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  userName;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @ApiModelProperty()
  role;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  email;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  readonly password;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  readonly lastLogin;

  @IsOptional()
  communities;

  @IsOptional()
  isDeleted;
}
