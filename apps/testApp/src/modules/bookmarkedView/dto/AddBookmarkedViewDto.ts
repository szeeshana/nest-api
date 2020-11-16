'use strict';

import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { BookmarkedViewTypeEnum } from '../../../enum';

export class AddBookmarkedViewDto {
  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  bookmarkedUrl: string;

  @IsEnum(BookmarkedViewTypeEnum)
  @IsNotEmpty()
  @ApiModelProperty()
  viewType: BookmarkedViewTypeEnum;

  @IsBoolean()
  @IsNotEmpty()
  @ApiModelProperty()
  isDefault: boolean;

  @IsObject()
  @IsNotEmpty()
  @ApiModelProperty()
  visibilitySettings: {};
}
