import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionTypeRepository } from './actionType.repository';
import { ActionTypeController } from './actionType.controller';
import { ActionTypeService } from './actionType.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActionTypeRepository])],
  controllers: [ActionTypeController],
  exports: [ActionTypeService],
  providers: [ActionTypeService],
})
export class ActionTypeModule {}
