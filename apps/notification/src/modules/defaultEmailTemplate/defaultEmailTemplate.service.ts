import { Injectable } from '@nestjs/common';
import { DefaultEmailTemplateRepository } from './defaultEmailTemplate.repository';
import { DefaultEmailTemplateEntity } from './defaultEmailTemplate.entity';

@Injectable()
export class DefaultEmailTemplateService {
  constructor(
    public readonly defaultEmailTemplateRepository: DefaultEmailTemplateRepository,
  ) {}

  /**
   * Get defaultEmailTemplates
   */
  async getDefaultEmailTemplates(options: {}): Promise<
    DefaultEmailTemplateEntity[]
  > {
    return this.defaultEmailTemplateRepository.find(options);
  }

  /**
   * Add defaultEmailTemplate
   */
  async addDefaultEmailTemplate(data: {}): Promise<DefaultEmailTemplateEntity> {
    const defaultEmailTemplateCreated = this.defaultEmailTemplateRepository.create(
      data,
    );
    return this.defaultEmailTemplateRepository.save(
      defaultEmailTemplateCreated,
    );
  }

  /**
   * Update defaultEmailTemplate
   */
  async updateDefaultEmailTemplate(options: {}, data: {}): Promise<{}> {
    return this.defaultEmailTemplateRepository.update(options, data);
  }

  /**
   * Delete defaultEmailTemplate
   */
  async deleteDefaultEmailTemplate(options: {}): Promise<{}> {
    return this.defaultEmailTemplateRepository.delete(options);
  }
}
