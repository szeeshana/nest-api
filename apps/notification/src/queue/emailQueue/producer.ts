import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '../../shared/services/config.service';

const configService = new ConfigService();
@Injectable()
export class EmailService {
  constructor(
    @InjectQueue(configService.get('EMAIL_QUEUE_NAME'))
    private readonly audioQueue: Queue,
  ) {}
  addInQueue(emailData) {
    this.audioQueue.add(emailData);
  }
}
