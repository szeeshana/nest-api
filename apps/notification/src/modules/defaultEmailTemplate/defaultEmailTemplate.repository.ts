import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { DefaultEmailTemplateEntity } from './defaultEmailTemplate.entity';

@EntityRepository(DefaultEmailTemplateEntity)
export class DefaultEmailTemplateRepository extends Repository<
  DefaultEmailTemplateEntity
> {}
