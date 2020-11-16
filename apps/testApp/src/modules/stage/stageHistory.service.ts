import { Injectable } from '@nestjs/common';
import { StageHistoryRepository } from './stageHistory.repository';
import { StageHistoryEntity } from './stageHistory.entity';

@Injectable()
export class StageHistoryService {
  constructor(public readonly stageHistoryRepository: StageHistoryRepository) {}

  /**
   * Get stageHistory
   */
  async getStageHistory(options: {}): Promise<StageHistoryEntity[]> {
    return this.stageHistoryRepository.find(options);
  }

  /**
   * Add stageHistory
   */
  async addStageHistory(data: {}): Promise<StageHistoryEntity> {
    const stageHistoryCreated = this.stageHistoryRepository.create(data);
    return this.stageHistoryRepository.save(stageHistoryCreated);
  }

  /**
   * Update stageHistory
   */
  async updateStageHistory(options: {}, data: {}): Promise<{}> {
    return this.stageHistoryRepository.update(options, data);
  }

  /**
   * Delete stageHistory
   */
  async deleteStageHistory(options: {}): Promise<{}> {
    return this.stageHistoryRepository.delete(options);
  }
}
