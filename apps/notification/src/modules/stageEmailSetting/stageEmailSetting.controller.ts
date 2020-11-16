import { ExceptionFilter } from '../../filters/rpcException.filter';
import { Controller, Logger, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { StageEmailSettingService } from './stageEmailSetting.service';
import { StageEmailSettingDto } from './dto';

@Controller()
export class StageEmailSettingController {
  private logger = new Logger('StageEmailSettingsController');
  constructor(
    private readonly stageEmailSettingService: StageEmailSettingService,
  ) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('addStageEmailSettings')
  /**
   * Add Stage Email Settings.
   * @param {Object} data Email settings data to be added.
   */
  async addStageEmailSettings(data: StageEmailSettingDto): Promise<{}> {
    const addedStageEmailSetting = await this.stageEmailSettingService.addStageEmailSetting(
      data,
    );
    this.logger.log('Stage Email Settings Successfully Added!');
    return addedStageEmailSetting;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('addUsersInStageEmailSettings')
  /**
   * Add Users in existing Stage Email Settings.
   * @param {Object} params Params to search email settings on.
   * @param {Array} data Users data to be added.
   */
  async addUsersInStageEmailSettings(dataParams: {
    params: {};
    data: [];
  }): Promise<{}> {
    const addedStageEmailSetting = await this.stageEmailSettingService.addUsersInStageEmailSettings(
      dataParams.params,
      dataParams.data,
    );
    this.logger.log('Users Added in Stage Email Settings Successfully!');
    return addedStageEmailSetting;
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('getStageEmailSetting')
  /**
   * Get Stage Email Settings.
   * @param {Object} data Options on which to get stage email settings.
   */
  getStageEmailSetting(dataParams: {}): Promise<{}> {
    this.logger.log('Get Stage Email Settings');
    return this.stageEmailSettingService.getStageEmailSettings({
      where: dataParams,
    });
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('updateStageEmailSetting')
  /**
   * update Stage Email Settings
   * @param {Object} data patched data object
   * @param {Object} params options to find the required object.
   */
  updateStageEmailSetting(data: { params: {}; data: {} }): Promise<{}> {
    this.logger.log('Update Stage Email Setting');
    return this.stageEmailSettingService.updateStageEmailSetting(
      data.params,
      data.data,
    );
  }

  @UseFilters(new ExceptionFilter())
  @MessagePattern('deleteStageEmailSetting')
  /**
   * Delete Existing Stage Email Settings.
   * @param {Object} data Options on which to delete stage email settings.
   */
  deleteStageEmailSetting(dataParams: {}): Promise<{}> {
    this.logger.log('Delete Stage Email Settings');
    return this.stageEmailSettingService.deleteStageEmailSetting(dataParams);
  }
}
