import { LeadPost } from "../models/lead-post";
import { logger } from "../services/logger.service";
import { LeadSource } from "./lead-source";

export class FacebookPersonalFeedSource implements LeadSource {
  async fetchPosts(): Promise<LeadPost[]> {
    logger.warn(
      "Facebook personal feed non supportato tramite API ufficiali. Usa una Pagina Facebook o una fonte alternativa.",
    );
    return [];
  }
}
