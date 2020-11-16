import { ThemeEntity } from './../theme/theme.entity';
import { LanguageEntity } from './../language/language.entity';
import { UserEntity } from './../user/user.entity';
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { CommonEntity } from './../../common/common.entity';
import { TABLES } from '../../common/constants/constants';

@Entity(TABLES.TENANT)
export class TenantEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 250 })
  name: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @OneToOne(() => UserEntity)
  @JoinColumn()
  ownerUser: Promise<UserEntity>;

  @OneToOne(() => LanguageEntity)
  @JoinColumn()
  language: Promise<LanguageEntity>;

  @OneToOne(() => ThemeEntity)
  @JoinColumn()
  theme: Promise<ThemeEntity>;
}
