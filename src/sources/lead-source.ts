import { LeadPost } from "../models/lead-post";

export interface LeadSource {
  fetchPosts(): Promise<LeadPost[]>;
}
