import { CommonEntity } from '../../common/common.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { ActionTypeEntity } from '../actionType/actionType.entity';

@Entity(TABLES.DEFAULT_EMAIL_TEMPLATE)
export class DefaultEmailTemplateEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 250 })
  name: string;

  @Column({ type: 'varchar', length: 250 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text' })
  featureImage: string;

  @Column({ type: 'text' })
  footerSection: string;

  @ManyToOne(() => ActionTypeEntity)
  @JoinColumn()
  actionType: ActionTypeEntity[];

  @Column({ type: 'int8' })
  frequency: number;

  @Column({ type: 'varchar', length: 250 })
  timeZone: string;

  @Column({ type: 'varchar', length: 250 })
  runAt: string;

  @Column({ type: 'varchar', length: 250 })
  nextRun: string;

  @Column({ type: 'varchar', length: 250 })
  lastRun: string;

  @Column({ type: 'varchar', length: 250 })
  senderName: string;

  @Column({ type: 'varchar', length: 200 })
  senderEmail: string;
}
