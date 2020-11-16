import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';
import { SharedModule } from '../../shared/shared.module';
import { VoteRepository } from './vote.repository';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([VoteRepository])],
  controllers: [VoteController],
  exports: [VoteService],
  providers: [VoteService],
})
export class VoteModule {}
