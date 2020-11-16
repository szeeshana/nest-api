import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunityRepository } from './opportunity.repository';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';
import { UserModule } from '../user/user.module';
import { OpportunityAttachmentService } from '../opportunityAttachment/opportunityAttachment.service';
import { OpportunityAttachmentModule } from '../opportunityAttachment/opportunityAttachment.module';
import { OpportunityAttachmentRepository } from '../opportunityAttachment/opportunityAttachment.repository';
import { BookmarkModule } from '../bookmark/bookmark.module';
import { BookmarkService } from '../bookmark/bookmark.service';
import { BookmarkRepository } from '../bookmark/bookmark.repository';
import { EntityTypeModule } from '../entityType/entity.module';
import { EntityTypeRepository } from '../entityType/entity.repository';
import { EntityTypeService } from '../entityType/entity.service';
import { VoteModule } from '../vote/vote.module';
import { VoteRepository } from '../vote/vote.repository';
import { VoteService } from '../vote/vote.service';
import { TagModule } from '../tag/tag.module';
import { TagService } from '../tag/tag.service';
import { TagRepository } from '../tag/tag.repository';
import { FollowingContentService } from '../followingContent/followingContent.service';
import { FollowingContentRepository } from '../followingContent/followingContent.repository';
import { FollowingContentModule } from '../followingContent/followingContent.module';
import { CommentModule } from '../comment/comment.module';
import { CommentService } from '../comment/comment.service';
import { CommentRepository } from '../comment/comment.repository';
import { MicroServiceClient } from '../../common/microServiceClient/microServiceClient';
import { RoleActorsModule } from '../roleActors/roleActors.module';
import { EntityExperienceSettingModule } from '../entityExperienceSetting/entityExperienceSetting.module';
import { EntityVisibilitySettingModule } from '../entityVisibilitySetting/entityVisibilitySetting.module';
import { RoleModule } from '../role/role.module';
import { OpportunityUserModule } from '../opportunityUser/opportunityUser.module';
import { MentionModule } from '../mention/mention.module';
import { CommunityModule } from '../community/community.module';
import { CircleModule } from '../circle/circle.module';
import { CustomFieldModule } from '../customField/customField.module';
import { EvaluationCriteriaModule } from '../evaluationCriteria/evaluationCriteria.module';
import { StageModule } from '../stage/stage.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { OpportunityTypeModule } from '../opportunityType/opportunityType.module';
import { SharedService } from '../../shared/services/shared.services';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OpportunityRepository,
      OpportunityAttachmentRepository,
      BookmarkRepository,
      EntityTypeRepository,
      VoteRepository,
      TagRepository,
      FollowingContentRepository,
      CommentRepository,
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => OpportunityAttachmentModule),
    forwardRef(() => BookmarkModule),
    forwardRef(() => EntityTypeModule),
    forwardRef(() => VoteModule),
    forwardRef(() => TagModule),
    forwardRef(() => FollowingContentModule),
    forwardRef(() => CommentModule),
    forwardRef(() => RoleActorsModule),
    forwardRef(() => EntityExperienceSettingModule),
    forwardRef(() => EntityVisibilitySettingModule),
    forwardRef(() => RoleModule),
    forwardRef(() => OpportunityUserModule),
    forwardRef(() => MentionModule),
    forwardRef(() => CommunityModule),
    forwardRef(() => CircleModule),
    forwardRef(() => CustomFieldModule),
    forwardRef(() => EvaluationCriteriaModule),
    forwardRef(() => StageModule),
    forwardRef(() => WorkflowModule),
    forwardRef(() => OpportunityTypeModule),
  ],
  controllers: [OpportunityController],
  exports: [
    OpportunityService,
    RoleActorsModule,
    EntityTypeModule,
    EntityExperienceSettingModule,
    EntityVisibilitySettingModule,
    RoleModule,
    OpportunityUserModule,
    FollowingContentModule,
    MentionModule,
    CustomFieldModule,
    EvaluationCriteriaModule,
    VoteModule,
    BookmarkModule,
  ],
  providers: [
    OpportunityService,
    OpportunityAttachmentService,
    BookmarkService,
    EntityTypeService,
    VoteService,
    TagService,
    FollowingContentService,
    CommentService,
    MicroServiceClient,
    SharedService,
  ],
})
export class OpportunityModule {}
