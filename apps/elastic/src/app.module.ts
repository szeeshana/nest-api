import { Module } from '@nestjs/common';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { UserModule } from './/modules/user/user.module';
import { OpportunityModule } from './modules/opportunity/opportunity.module';
import { OmnisearchModule } from './modules/omnisearch/omnisearch.module';

@Module({
  imports: [OpportunityModule, UserModule, ChallengeModule, OmnisearchModule],
  exports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
