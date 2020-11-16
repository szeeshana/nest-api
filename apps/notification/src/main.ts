import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { Logger } from '@nestjs/common';
import { ConfigService } from './shared/services/config.service';
/**
 * Log messages through nest looger
 */
const logger = new Logger('Notification');
const configService = new ConfigService();
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.REDIS,
    options: {
      url: configService.get('REDIS_URL'),
    },
  });

  app.listen(() => {
    logger.log('Notifictaion Service is running... ');
  });
}
bootstrap();
