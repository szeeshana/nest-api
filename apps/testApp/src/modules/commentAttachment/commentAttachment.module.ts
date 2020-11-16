import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentAttachmentRepository } from './commentAttachment.repository';
import { CommentAttachmentController } from './commentAttachment.controller';
import { CommentAttachmentService } from './commentAttachment.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommentAttachmentRepository])],
  controllers: [CommentAttachmentController],
  exports: [CommentAttachmentService],
  providers: [CommentAttachmentService],
})
export class CommentAttachmentModule {}
