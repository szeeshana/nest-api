import { CommonEntity } from '../../common/common.entity';
import { Entity, Column } from 'typeorm';
import { TABLES, EMAIL_STATUSES } from '../../common/constants/constants';

@Entity(TABLES.SEND_EMAIL)
export class SendEmailEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 250 })
  to: string;

  @Column({ type: 'varchar', length: 250 })
  from: string;

  @Column({ type: 'text' })
  emailContent: string;

  @Column({ type: 'text', nullable: true })
  subject: string;

  @Column({
    type: 'enum',
    enum: EMAIL_STATUSES,
    default: EMAIL_STATUSES.PENDING,
  })
  status: EMAIL_STATUSES;

  @Column({ nullable: false })
  community: number;
}
