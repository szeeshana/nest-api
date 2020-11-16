import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleActorsRepository } from './roleActors.repository';
import { RoleActorsController } from './roleActors.controller';
import { RoleActorsService } from './roleActors.service';
import { CircleModule } from '../circle/circle.module';
import { EntityExperienceSettingModule } from '../entityExperienceSetting/entityExperienceSetting.module';
import { CommunityWisePermissionModule } from '../communityWisePermission/communityWisePermission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleActorsRepository]),
    forwardRef(() => CircleModule),
    forwardRef(() => EntityExperienceSettingModule),
    forwardRef(() => CommunityWisePermissionModule),
  ],
  controllers: [RoleActorsController],
  exports: [RoleActorsService],
  providers: [RoleActorsService],
})
export class RoleActorsModule {}
