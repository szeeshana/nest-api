import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { EmailTemplateEntity } from './emailTemplate.entity';

@EntityRepository(EmailTemplateEntity)
export class EmailTemplateRepository extends Repository<EmailTemplateEntity> {}
