import { CircleEntity } from '../circle/circle.entity';
import { UserEntity } from './user.entity';
import { Column, Entity, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { UserRole } from '../../enum/user-role.enum';
import { TABLES } from '../../common/constants/constants';

@Entity(TABLES.USER_CIRCLES)
export class UserCircles {
  @RelationId((circleUser: UserCircles) => circleUser.user)
  userId: number;

  @RelationId((circleUser: UserCircles) => circleUser.circle)
  circleId: number;

  @ManyToOne(() => UserEntity, user => user.id, { primary: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => CircleEntity, circle => circle.id, {
    primary: true,
  })
  @JoinColumn({ name: 'circle_id' })
  circle: CircleEntity;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
