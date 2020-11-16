'use strict';

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class GetVote {
  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  entityObjectId: string;

  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  type: string;
}

export class GetVoteQuery {
  @IsString()
  @IsNotEmpty()
  @ApiModelProperty()
  community: string;
}
