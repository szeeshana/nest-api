export interface OpportunityInterface {
  id: number;
  oppNumber: number;
  title: string;
  description: string;
  community?: {};
  communityId: number;
  isDeleted: boolean;
}
