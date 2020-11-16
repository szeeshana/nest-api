import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '../../shared/services/config.service';
import { SharedModule } from '../../shared/shared.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [SharedModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME'),
          password: configService.get('ELASTICSEARCH_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  exports: [],
  providers: [UserService],
})
export class UserModule {}
