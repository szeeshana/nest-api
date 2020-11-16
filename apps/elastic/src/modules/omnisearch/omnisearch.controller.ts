import { Controller, Logger } from '@nestjs/common';
import { OmnisearchService } from './omnisearch.service';
import { MessagePattern } from '@nestjs/microservices';
import { SearchDto } from './dto';

@Controller()
export class OmnisearchController {
  private logger = new Logger('Search (Elastic) controller');

  constructor(private readonly omnisearchService: OmnisearchService) {}

  @MessagePattern('elastic-generic-search')
  performSearch(data: SearchDto): {} {
    this.logger.log('Msg Dispatch From elastic-generic-search');
    return this.omnisearchService.performSearch(data);
  }
}
