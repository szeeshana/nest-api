import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { ActionItemLogEntity } from './actionItemLog.entity';

@EntityRepository(ActionItemLogEntity)
export class ActionItemLogRepository extends Repository<ActionItemLogEntity> {}
