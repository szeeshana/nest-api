import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConfigService } from '../../shared/services/config.service';
import { ActionItemLogEntity } from './actionItemLog.entity';
const configService = new ConfigService();

@WebSocketGateway(configService.getNumber('NOTIFICATION_SOCKET_PORT'), {
  namespace: '/action-item-log',
})
export class ActionItemLogGateway {
  @WebSocketServer() wss: Server;

  async pushActionItemLog(
    actionItemLog: ActionItemLogEntity,
    userId: number,
    community: number,
  ): Promise<void> {
    const pushKey = `action-item-log-${userId}-${community}`;
    const data = {
      actionItemLog: actionItemLog,
    };

    this.wss.emit(pushKey, data);
  }
}
