import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CommentThreadService } from './commentThread.service';
import { CommentThreadController } from './commentThread.controller';
import { ConfigService } from '../../shared/services/config.service';
const configService = new ConfigService();

@WebSocketGateway(configService.getNumber('SOCKET_PORT'), {
  namespace: '/comment-thread',
})
export class CommentThreadGateway {
  constructor(
    private readonly commentThreadService: CommentThreadService,
    private readonly commentThreadController: CommentThreadController,
  ) {}
  @WebSocketServer() wss: Server;

  async pushCommentThread(
    communityId: string,
    entityObjectId: string,
  ): Promise<void> {
    const inviteData = await this.commentThreadService.findCommentThreads(
      communityId,
      entityObjectId,
    );
    const finalDataForComments = await this.commentThreadController.getProcessedDataForCommentThread(
      inviteData,
    );
    const pushKey = communityId.toString() + entityObjectId;
    this.wss.emit(pushKey, finalDataForComments);
  }

  @SubscribeMessage('requestCommentThread')
  async requestInvites(@MessageBody()
  data: {
    communityId: string;
    entityObjectId: string;
  }): Promise<{}> {
    const inviteData = await this.commentThreadService.findCommentThreads(
      data.communityId,
      data.entityObjectId,
    );
    return inviteData;
  }
}
