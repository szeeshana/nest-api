import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { StageEmailSettingEntity } from './stageEmailSetting.entity';

@EntityRepository(StageEmailSettingEntity)
export class StageEmailSettingRepository extends Repository<
  StageEmailSettingEntity
> {}
