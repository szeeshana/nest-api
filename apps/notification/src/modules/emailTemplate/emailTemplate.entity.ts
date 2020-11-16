import { CommonEntity } from './../../common/common.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLES } from '../../common/constants/constants';
import { ActionTypeEntity } from '../actionType/actionType.entity';

@Entity(TABLES.EMAIL_TEMPLATE)
export class EmailTemplateEntity extends CommonEntity {
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

  @Column({ type: 'simple-json', nullable: true })
  runAt: { hour: number; minute: number; second: number };

  @Column({ type: 'varchar', length: 250 })
  nextRun: string;

  @Column({ type: 'varchar', length: 250 })
  lastRun: string;

  @Column({ nullable: false })
  community: number;

  @Column({ type: 'varchar', length: 250 })
  senderName: string;

  @Column({ type: 'varchar', length: 200 })
  senderEmail: string;
}
