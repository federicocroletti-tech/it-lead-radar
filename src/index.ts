import { config } from "./config";
import { LeadPost } from "./models/lead-post";
import { fetchRecentRedditPosts } from "./sources/reddit.source";
import { BrevoMailService } from "./services/brevo-mail.service";
import { DedupeService } from "./services/dedupe.service";
import { logger } from "./services/logger.service";
import { isRelevant, scorePost } from "./services/scoring.service";

async function run(): Promise<void> {
  logger.info("Avvio monitor IT lead radar...");

  const dedupeService = new DedupeService();
  const mailService = new BrevoMailService({
    apiKey: config.brevo.apiKey,
    from: config.email.from,
    to: config.email.to,
  });

  const posts = await fetchRecentRedditPosts(
    config.subreddits,
    config.redditUserAgent,
  );
  logger.info(`Post Reddit recuperati: ${posts.length}`);

  const scoredPosts: LeadPost[] = posts
    .map((post) => {
      const scoring = scorePost(
        post,
        config.positiveKeywords,
        config.negativeKeywords,
      );
      return {
        ...post,
        score: scoring.score,
        matchedKeywords: scoring.matchedKeywords,
      };
    })
    .filter((post) => isRelevant(post.score ?? 0, config.minScore));

  logger.info(`Post sopra soglia (${config.minScore}): ${scoredPosts.length}`);

  let sentCount = 0;

  for (const post of scoredPosts) {
    const alreadyNotified = await dedupeService.hasBeenNotified(post);
    if (alreadyNotified) {
      logger.info(`Gia notificato: ${post.source}:${post.sourceId}`);
      continue;
    }

    try {
      await mailService.sendLeadAlert(post);
      await dedupeService.markAsNotified(post);
      sentCount += 1;
      logger.info(`Notifica inviata: ${post.title}`);
    } catch (error) {
      logger.error(
        `Invio email fallito per ${post.source}:${post.sourceId}`,
        error,
      );
    }
  }

  logger.info(`Esecuzione completata. Nuove notifiche inviate: ${sentCount}`);
}

run().catch((error) => {
  logger.error("Errore non gestito durante l'esecuzione", error);
  process.exitCode = 1;
});
