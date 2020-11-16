import { Injectable } from '@nestjs/common';
import { SendEmailRepository } from './sendEmail.repository';
import { SendEmailEntity } from './sendEmail.entity';

@Injectable()
export class SendEmailService {
  constructor(public readonly sendEmailRepository: SendEmailRepository) {}

  /**
   * Get sendEmails
   */
  async getSendEmails(options: {}): Promise<SendEmailEntity[]> {
    return this.sendEmailRepository.find(options);
  }

  /**
   * Add sendEmail
   */
  async addSendEmail(data: {}): Promise<SendEmailEntity> {
    const sendEmailCreated = this.sendEmailRepository.create(data);
    return this.sendEmailRepository.save(sendEmailCreated);
  }

  /**
   * Update sendEmail
   */
  async updateSendEmail(options: {}, data: {}): Promise<{}> {
    return this.sendEmailRepository.update(options, data);
  }

  /**
   * Delete sendEmail
   */
  async deleteSendEmail(options: {}): Promise<{}> {
    return this.sendEmailRepository.delete(options);
  }
}
