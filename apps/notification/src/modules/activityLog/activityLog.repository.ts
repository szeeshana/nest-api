import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { ActivityLogEntity } from './activityLog.entity';

@EntityRepository(ActivityLogEntity)
export class ActivityLogRepository extends Repository<ActivityLogEntity> {}
