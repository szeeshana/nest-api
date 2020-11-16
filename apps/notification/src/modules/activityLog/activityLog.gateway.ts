import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConfigService } from '../../shared/services/config.service';
import { ActivityLogEntity } from './activityLog.entity';
const configService = new ConfigService();

@WebSocketGateway(configService.getNumber('NOTIFICATION_SOCKET_PORT'), {
  namespace: '/activity-log',
})
export class ActivityLogGateway {
  @WebSocketServer() wss: Server;

  async pushActivityLog(params: {
    activityLog: ActivityLogEntity;
    userId: number;
    community: number;
    isNotification?: boolean;
  }): Promise<void> {
    let pushKey = `activity-log-`;
    if (params.isNotification) {
      pushKey = pushKey + `notification-`;
    }
    pushKey = pushKey + `${params.userId}-${params.community}`;

    const data = {
      activityLog: params.activityLog,
    };

    this.wss.emit(pushKey, data);
  }
}
