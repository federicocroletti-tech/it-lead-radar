export interface LeadPost {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  text: string;
  url: string;
  author?: string;
  createdAt?: string;
  subreddit?: string;
  score?: number;
  matchedKeywords?: string[];
}
