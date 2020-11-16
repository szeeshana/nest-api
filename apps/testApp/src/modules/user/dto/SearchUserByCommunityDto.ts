'use strict';

import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class SearchUserByCommunityDto {
  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly take;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly skip;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly sortBy;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly sortType;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly searchByName;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly searchByUsername;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly searchByEmail;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly searchText;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly showArchived;

  @IsString()
  @IsOptional()
  @ApiModelProperty()
  readonly exportData;

  // @IsNumber()
  @IsNotEmpty()
  @ApiModelProperty()
  readonly communityId;
}
