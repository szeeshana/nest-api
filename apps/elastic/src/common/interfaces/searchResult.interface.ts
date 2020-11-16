import { ChallengeInterface, OpportunityInterface, UserInterface } from '.';

export interface SearchResultInterface {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: Array<{
      _index: string;
      _source: OpportunityInterface | ChallengeInterface | UserInterface;
    }>;
  };
}
