import { Injectable } from '@nestjs/common';
import { ActionTypeRepository } from './actionType.repository';
import { ActionTypeEntity } from './actionType.entity';

@Injectable()
export class ActionTypeService {
  constructor(public readonly actionTypeRepository: ActionTypeRepository) {}

  /**
   * Get actionTypes
   */
  async getActionTypes(options: {}): Promise<ActionTypeEntity[]> {
    return this.actionTypeRepository.find(options);
  }

  /**
   * Add actionType
   */
  async addActionType(data: {}): Promise<ActionTypeEntity> {
    const actionTypeCreated = this.actionTypeRepository.create(data);
    return this.actionTypeRepository.save(actionTypeCreated);
  }

  /**
   * Update actionType
   */
  async updateActionType(options: {}, data: {}): Promise<{}> {
    return this.actionTypeRepository.update(options, data);
  }

  /**
   * Delete actionType
   */
  async deleteActionType(options: {}): Promise<{}> {
    return this.actionTypeRepository.delete(options);
  }
}
