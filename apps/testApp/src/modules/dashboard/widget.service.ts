import { Injectable } from '@nestjs/common';
import { WidgetEntity } from './widget.entity';
import { WidgetRepository } from './widget.repository';

@Injectable()
export class WidgetService {
  constructor(public readonly dashboardRepository: WidgetRepository) {}

  /**
   * Get dashboards
   */
  async getWidgets(options: {}): Promise<WidgetEntity[]> {
    return this.dashboardRepository.find(options);
  }

  /**
   * Add dashboard
   */
  async addWidget(data: {}): Promise<WidgetEntity> {
    const dashboardCreated = this.dashboardRepository.create(data);
    return this.dashboardRepository.save(dashboardCreated);
  }

  /**
   * Update dashboard
   */
  async updateWidget(options: {}, data: {}): Promise<{}> {
    return this.dashboardRepository.update(options, data);
  }

  /**
   * Delete dashboard
   */
  async deleteWidget(options: {}): Promise<{}> {
    return this.dashboardRepository.delete(options);
  }
}
