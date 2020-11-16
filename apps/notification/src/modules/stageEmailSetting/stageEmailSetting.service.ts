import { Injectable } from '@nestjs/common';
import { StageEmailSettingRepository } from './stageEmailSetting.repository';
import { StageEmailSettingEntity } from './stageEmailSetting.entity';

@Injectable()
export class StageEmailSettingService {
  constructor(
    public readonly stageEmailSettingRepository: StageEmailSettingRepository,
  ) {}

  /**
   * Get stage emails
   */
  async getStageEmailSettings(options: {}): Promise<StageEmailSettingEntity[]> {
    return this.stageEmailSettingRepository.find(options);
  }

  /**
   * Get one stage email settings
   */
  async getOneStageEmailSettings(options: {}): Promise<
    StageEmailSettingEntity
  > {
    return this.stageEmailSettingRepository.findOne(options);
  }

  /**
   * Add stage emails
   */
  async addStageEmailSetting(data: {}): Promise<StageEmailSettingEntity> {
    const emailSettingsCreated = this.stageEmailSettingRepository.create(data);
    return this.stageEmailSettingRepository.save(emailSettingsCreated);
  }

  /**
   * Add Users in existing Stage Email Settings.
   * @param {Object} options Options to search email settings on.
   * @param {Array} data Users data to be added.
   */
  async addUsersInStageEmailSettings(options: {}, data: []): Promise<{}> {
    const existingSettigns = await this.getOneStageEmailSettings({
      where: options,
    });
    let dataAdded = {};
    if (existingSettigns) {
      const mappedData = data.map(user => ({
        emailType: options['emailType'],
        entityType: options['entityType'],
        entityObjectId: options['entityObjectId'],
        community: options['community'],
        userId: user['userId'],
        userEmail: user['userEmail'],
        reminderFrequency: existingSettigns.reminderFrequency,
        timeZone: existingSettigns.timeZone,
        nextRun: existingSettigns.nextRun,
        lastRun: existingSettigns.lastRun,
        actionType: existingSettigns.actionTypeId,
      }));

      dataAdded = await this.addStageEmailSetting(mappedData);
    }
    return dataAdded;
  }

  /**
   * Update stage emails
   */
  async updateStageEmailSetting(options: {}, data: {}): Promise<{}> {
    return this.stageEmailSettingRepository.update(options, data);
  }

  /**
   * Delete stage emails
   */
  async deleteStageEmailSetting(options: {}): Promise<{}> {
    return this.stageEmailSettingRepository.delete(options);
  }
}
