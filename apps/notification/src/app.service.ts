import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(data): string {
    return 'Message from notification service ' + data;
  }
}
