import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  private logger = new Logger('Notification controller');

  constructor(private readonly appService: AppService) {}

  @MessagePattern('notificationService')
  getHello(data: []): string {
    this.logger.log('Msg Dispatch From Notification Service');
    return this.appService.getHello(data);
  }
}
