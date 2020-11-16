import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';

import { CommentThreadService } from './commentThread.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import * as _ from 'lodash';
import { VoteService } from '../vote/vote.service';
import { In } from 'typeorm';
import { TagService } from '../tag/tag.service';
import { MentionService } from '../mention/mention.service';

@Controller('comment-thread')
export class CommentThreadController {
  constructor(
    private readonly commentThreadService: CommentThreadService,
    private readonly voteService: VoteService,
    private readonly tagService: TagService,
    private readonly mentionService: MentionService,
  ) {}

  @Post()
  async addCommentThread(@Body() body: {}): Promise<ResponseFormat> {
    const response = await this.commentThreadService.addCommentThread(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllCommentThreads(@Query()
  queryParams: {
    entityObjectId: string;
    community: string;
  }): Promise<ResponseFormat> {
    const commentThreads = await this.commentThreadService.findCommentThreads(
      queryParams.community,
      queryParams.entityObjectId,
    );

    const finalDataForComments = await this.getProcessedDataForCommentThread(
      commentThreads,
    );

    return ResponseFormatService.responseOk(finalDataForComments, 'All');
  }

  @Get(':id')
  async getCommentThread(@Param('id') id: string): Promise<ResponseFormat> {
    const commentThread = await this.commentThreadService.getCommentThreads({
      id: id,
    });
    return ResponseFormatService.responseOk(commentThread, 'All');
  }

  @Patch(':id')
  async updateCommentThread(
    @Param('id') id: string,
    @Body() body: {},
  ): Promise<ResponseFormat> {
    const updateData = await this.commentThreadService.updateCommentThread(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, '');
  }

  @Delete(':id')
  async removeCommentThread(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteData = await this.commentThreadService.deleteCommentThread({
      id: id,
    });
    return ResponseFormatService.responseOk(deleteData, '');
  }

  async getProcessedDataForCommentThread(commentThreads) {
    const mainThreadComments = _.map(commentThreads, 'comment.id');
    const mainThreadCommentTags = _.map(commentThreads, 'comment.tags');
    const threadParticipantComments = [];
    const threadParticipantCommentTags = [];
    let mentionIds = [];

    _.map(commentThreads, (val, _key) => {
      mentionIds = mentionIds.concat(val.comment.mentions);
      _.map(val.commentThreadPerticipants, (valCtp, _keyCtp) => {
        threadParticipantComments.push(valCtp.comment.id);
        threadParticipantCommentTags.push(valCtp.comment.tags);
        mentionIds = mentionIds.concat(valCtp.comment.mentions);
      });
    });

    const allCommentIds = [...mainThreadComments, ...threadParticipantComments];
    const allCommentTags = [
      ...mainThreadCommentTags,
      ...threadParticipantCommentTags,
    ];
    const tagsData = {};

    const allCommentTagIds = _.uniq(_.flatMap(allCommentTags));
    if (allCommentTagIds.length) {
      const tempTagsData = await this.tagService.getTags({
        where: { id: In(allCommentTagIds) },
      });
      if (tempTagsData.length) {
        _.map(tempTagsData, (val, _key) => {
          tagsData[val.id] = val.name;
        });
      }
    }
    const upvoteCountObject = {};
    if (allCommentIds.length) {
      const counts = await this.voteService.getTypeVoteCount(
        allCommentIds,
        'comment',
      );

      const groupedCounts = _.groupBy(counts, 'entityObjectId');
      for (const iterator in groupedCounts) {
        upvoteCountObject[iterator] = groupedCounts[iterator].length;
      }
    }

    const allMentions = mentionIds.length
      ? await this.mentionService.getMentions({ where: { id: In(mentionIds) } })
      : [];
    const mentionsData = _.groupBy(allMentions, 'entityObjectId');

    return {
      data: commentThreads,
      upvotes: upvoteCountObject,
      tagsData: tagsData,
      mentionsData,
      commentCounts: allCommentIds.length,
    };
  }
}
