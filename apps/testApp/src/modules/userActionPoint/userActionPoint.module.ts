import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserActionPointRepository } from './userActionPoint.repository';
import { UserActionPointController } from './userActionPoint.controller';
import { UserActionPointService } from './userActionPoint.service';
import { UserModule } from '../user/user.module';
import { CircleModule } from '../circle/circle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserActionPointRepository]),
    UserModule,
    CircleModule,
  ],
  controllers: [UserActionPointController],
  exports: [UserActionPointService],
  providers: [UserActionPointService],
})
export class UserActionPointModule {}
