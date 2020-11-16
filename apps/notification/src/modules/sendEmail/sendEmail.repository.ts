import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { SendEmailEntity } from './sendEmail.entity';

@EntityRepository(SendEmailEntity)
export class SendEmailRepository extends Repository<SendEmailEntity> {}
