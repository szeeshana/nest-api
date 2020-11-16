'use strict';

import { IsNotEmpty, IsInt, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class GetBulkOpportunityPermissionsDto {
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  opportunities: number[];
}
