import { Controller, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern } from '@nestjs/microservices';
import { isEmpty } from 'lodash';
@Controller()
export class UserController {
  private logger = new Logger('Notification controller');

  constructor(private readonly userService: UserService) {}

  @MessagePattern('elastic-add-user-data')
  addUserData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-add-user-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-add-user-data');
    return this.userService.addUserData(data);
  }
  @MessagePattern('elastic-sync-user-data')
  syncUserData(data): void {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-sync-user-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-sync-user-data');
    this.userService.syncUserData(data);
  }
  @MessagePattern('elastic-edit-user-data')
  editUserData(data): {} {
    if (isEmpty(data)) {
      this.logger.log(
        'Msg Dispatch From elastic-edit-user-data : No Data Found',
      );
      return data;
    }
    this.logger.log('Msg Dispatch From elastic-edit-user-data');
    return this.userService.editUserData(data);
  }
}
