import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { getRepository, getConnection, In } from 'typeorm';

import { CircleService } from './circle.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import {
  AddCircleDto,
  EditCircleDto,
  AddUsersInCircleDto,
  SearchCircleDto,
  DeleteUsersInCircleDto,
  DeleteUserCircles,
} from './dto';
import { Request } from 'express';
import { UserCircles } from '../user/user.circles.entity';
import { UtilsService } from '../../providers/utils.service';
import * as _ from 'lodash';
@Controller('circle')
export class CircleController {
  constructor(private readonly circleService: CircleService) {}

  @Post()
  async addCircle(
    @Body() body: AddCircleDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const finalObject = [];
    const groupNames = _.map(body.groups, 'name');
    const dataDuplicate = await this.circleService.getCircles({
      where: { name: In(groupNames), community: body.communityId },
    });
    if (dataDuplicate.length) {
      return ResponseFormatService.responseUnprocessableEntity(
        [],
        'Group(s) name duplicate error',
      );
    }
    for (const iterator of body.groups) {
      finalObject.push({
        ...iterator,
        cratedBy: req['userData'].id,
        updatedBy: req['userData'].id,
        pinnedToShortcut: body.pinToShortcut,
        community: body.communityId,
        isDeleted: false,
        user: req['userData'].id,
      });
    }
    const response = await this.circleService.addCircle(finalObject);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Post('users')
  async addUserInCircle(
    @Body() body: AddUsersInCircleDto,
  ): Promise<ResponseFormat> {
    const primiseArr = [];
    for (const iterator of body.users) {
      primiseArr.push(
        getConnection().query(`INSERT INTO public.user_circles(
      user_id, circle_id, role)
      VALUES ('${parseInt(iterator.userId)}', '${parseInt(
          iterator.circleId,
        )}', '${iterator.role}')`),
      );
    }
    const savedResponse = await Promise.all(primiseArr);
    return ResponseFormatService.responseOk(
      savedResponse,
      'Created Successfully',
    );
  }

  @Get()
  async getAllCircles(@Query() queryParams: {}): Promise<ResponseFormat> {
    const options = {
      relations: ['circleUsers', 'circleUsers.user', 'community'],
      where: queryParams,
    };
    const themes = await this.circleService.getCircles(options);
    return ResponseFormatService.responseOk(themes, 'All');
  }

  @Get('search')
  async searchCircles(
    @Query() queryParams: SearchCircleDto,
  ): Promise<ResponseFormat> {
    const data = await this.circleService.searchCircles(
      queryParams.limit,
      queryParams.offset,
      {
        name: queryParams.searchByName ? queryParams.searchByName : '',
      },
      queryParams.showArchived ? queryParams.showArchived : 'false',
      queryParams.communityId,
    );
    const totalCircles = await this.circleService.getCircleCount(
      queryParams.showArchived,
      queryParams.communityId,
    );
    if (!data[0].length) {
      return ResponseFormatService.responseOk([], 'No Circles Available');
    }
    let finalData = [];
    for (const iterator of data[0]) {
      const childCount = await this.circleService.getCount({
        where: {
          parentCircleId: iterator.id,
        },
      });
      const invites = await getConnection().query(
        `SELECT invite_accepted FROM invite WHERE '${iterator.id}' = ANY (circles);`,
      );
      const signupPercentage = UtilsService.getCommunitySignupRate(invites);
      finalData.push({
        ...iterator,
        userCount: iterator.circleUsers.length,
        numberOfChild: childCount,
        signupPercentage: signupPercentage,
      });
    }
    if (queryParams.sortBy && queryParams.sortType) {
      const dataSorted = _.orderBy(
        finalData,
        [queryParams.sortBy],
        [queryParams.sortType],
      );
      finalData = dataSorted;
    }
    return ResponseFormatService.responseOk(
      { data: finalData, count: totalCircles },
      'All',
    );
  }

  @Get('count')
  async countCircles(
    @Query() queryParams: SearchCircleDto,
  ): Promise<ResponseFormat> {
    const archived = await this.circleService.getCircleCount(
      'true',
      queryParams.communityId,
    );
    const unArchived = await this.circleService.getCircleCount(
      'false',
      queryParams.communityId,
    );

    return ResponseFormatService.responseOk(
      {
        archive: archived,
        active: unArchived,
      },
      'Circles Count By',
    );
  }

  @Get(':id')
  async getCircle(@Param('id') circleId: string): Promise<ResponseFormat> {
    const theme = await this.circleService.getCircles({ id: circleId });
    return ResponseFormatService.responseOk(theme, 'All');
  }

  @Patch(':id')
  async updateCircle(
    @Param('id') circleId: string,
    @Body() body: EditCircleDto,
  ): Promise<ResponseFormat> {
    const updateData = await this.circleService.updateCircle(
      { id: circleId },
      body,
    );
    return ResponseFormatService.responseOk(updateData, '');
  }
  @Delete('users')
  async deleteUserInCircle(
    @Body() body: DeleteUsersInCircleDto,
  ): Promise<ResponseFormat> {
    const userCirclesRepository = getRepository(UserCircles);
    const deletedData = await userCirclesRepository.delete({
      userId: In(body.users),
      circleId: body.circleId,
    });
    return ResponseFormatService.responseOk(
      deletedData,
      'Deleted Successfully',
    );
  }

  @Delete('user-circles')
  async deleteUserCircles(
    @Body() body: DeleteUserCircles,
  ): Promise<ResponseFormat> {
    const userCirclesRepository = getRepository(UserCircles);
    const deletedData = await userCirclesRepository.delete({
      userId: body.user,
      circleId: In(body.circleIds),
    });
    return ResponseFormatService.responseOk(
      deletedData,
      'Deleted Successfully',
    );
  }

  @Delete(':id')
  async removeCircle(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteResponse = await this.circleService.updateCircle(
      { id: id },
      { isDeleted: true },
    );
    return ResponseFormatService.responseOk(
      deleteResponse,
      'Group Archived Successfully',
    );
  }
}
