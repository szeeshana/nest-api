import { Injectable } from '@nestjs/common';
import { UserCircleRepository } from './userCircle.repository';
import { UserCircles } from './user.circles.entity';

@Injectable()
export class UserCircleService {
  constructor(public readonly userCircleRepository: UserCircleRepository) {}

  /**
   * Get userCircles
   */
  async getUserCircles(options: {}): Promise<UserCircles[]> {
    return this.userCircleRepository.find(options);
  }

  /**
   * Add userCircle
   */
  async addUserCircle(data: {}): Promise<UserCircles> {
    const userCircleCreated = this.userCircleRepository.create(data);
    return this.userCircleRepository.save(userCircleCreated);
  }

  /**
   * Update userCircle
   */
  async updateUserCircle(options: {}, data: {}): Promise<{}> {
    return this.userCircleRepository.update(options, data);
  }
}
