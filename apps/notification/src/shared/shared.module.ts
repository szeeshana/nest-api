import { Module, Global } from '@nestjs/common';

import { ConfigService } from './services/config.service';
import { MailService } from './services/mailer.service';

const providers = [ConfigService, MailService];

@Global()
@Module({
  providers,
  imports: [],
  exports: [...providers],
})
export class SharedModule {}
