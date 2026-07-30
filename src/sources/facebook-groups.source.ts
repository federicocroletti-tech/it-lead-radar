import { LeadPost } from "../models/lead-post";
import { logger } from "../services/logger.service";
import { LeadSource } from "./lead-source";

export class FacebookGroupsSource implements LeadSource {
  async fetchPosts(): Promise<LeadPost[]> {
    logger.warn(
      "Facebook Groups non supportato tramite API ufficiali per questa app. Valutare fonti alternative o processi manuali.",
    );
    return [];
  }
}
