import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentRepository } from './comment.repository';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentThreadModule } from '../commentThread/commentThread.module';
import { CommentThreadService } from '../commentThread/commentThread.service';
import { CommentThreadRepository } from '../commentThread/commentThread.repository';
import { CommentThreadParticipantModule } from '../commentThreadParticipant/commentThreadParticipant.module';
import { CommentThreadParticipantService } from '../commentThreadParticipant/commentThreadParticipant.service';
import { CommentThreadParticipantRepository } from '../commentThreadParticipant/commentThreadParticipant.repository';
import { CommentAttachmentModule } from '../commentAttachment/commentAttachment.module';
import { CommentAttachmentService } from '../commentAttachment/commentAttachment.service';
import { CommentAttachmentRepository } from '../commentAttachment/commentAttachment.repository';
import { CommentThreadGateway } from '../commentThread/commentThread.gateway';
import { MentionModule } from '../mention/mention.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommentRepository,
      CommentThreadRepository,
      CommentThreadParticipantRepository,
      CommentAttachmentRepository,
    ]),
    forwardRef(() => CommentThreadModule),
    forwardRef(() => CommentThreadParticipantModule),
    forwardRef(() => CommentAttachmentModule),
    forwardRef(() => MentionModule),
  ],
  controllers: [CommentController],
  exports: [CommentService],
  providers: [
    CommentService,
    CommentThreadService,
    CommentThreadParticipantService,
    CommentAttachmentService,
    CommentThreadGateway,
  ],
})
export class CommentModule {}
