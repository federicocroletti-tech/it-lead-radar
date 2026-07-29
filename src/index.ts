import { config } from "./config";
import { LeadPost } from "./models/lead-post";
import { BrevoMailService } from "./services/brevo-mail.service";
import { DedupeService } from "./services/dedupe.service";
import { logger } from "./services/logger.service";
import { runSources } from "./services/source-runner.service";
import { isRelevant, scorePost } from "./services/scoring.service";

function dedupePosts(posts: LeadPost[]): LeadPost[] {
  const seen = new Set<string>();
  const unique: LeadPost[] = [];

  for (const post of posts) {
    const key = `${post.source}:${post.sourceId}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(post);
  }

  return unique;
}

function formatKeywords(keywords: string[] | undefined): string {
  if (!keywords || keywords.length === 0) {
    return "none";
  }
  return keywords.join(", ");
}

async function run(): Promise<void> {
  logger.info("IT Lead Radar started");
  logger.info(`Dry-run: ${config.dryRun}`);
  logger.info(`Source enabled - Reddit: ${config.sources.redditEnabled}`);
  logger.info(`Source enabled - RSS: ${config.sources.rssEnabled}`);
  logger.info(`Source enabled - Hacker News: ${config.sources.hackerNewsEnabled}`);
  logger.info(`Source enabled - Facebook Page: ${config.sources.facebookPageEnabled}`);
  logger.info(
    `Source enabled - Facebook Messenger: ${config.sources.facebookMessengerEnabled}`,
  );
  logger.info(`MIN_SCORE: ${config.minScore}`);
  logger.info(`Configured subreddits: ${config.subreddits.length}`);
  logger.info(`Configured RSS feeds: ${config.rssFeeds.length}`);
  logger.info(`Brevo configured: ${config.brevo.apiKey ? "yes" : "no"}`);
  logger.info(`ALERT_EMAIL_TO configured: ${config.email.to ? "yes" : "no"}`);
  logger.info(`ALERT_EMAIL_FROM configured: ${config.email.from ? "yes" : "no"}`);

  const dedupeService = new DedupeService();
  const mailService = new BrevoMailService({
    apiKey: config.brevo.apiKey,
    from: config.email.from,
    to: config.email.to,
    dryRun: config.dryRun,
  });

  const sourceRun = await runSources({
    subreddits: config.subreddits,
    rssFeeds: config.rssFeeds,
    redditUserAgent: config.redditUserAgent,
    sources: config.sources,
  });

  const totalFetchedPosts = sourceRun.posts.length;
  const uniquePosts = dedupePosts(sourceRun.posts);

  const scoredPosts: LeadPost[] = uniquePosts
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

  let sentCount = 0;
  let alreadyNotifiedCount = 0;
  let notificationErrors = 0;

  for (const post of scoredPosts) {
    logger.info(
      `[lead] source=${post.source} | score=${post.score ?? 0} | title=${post.title}`,
    );
    logger.info(`[lead] matchedKeywords=${formatKeywords(post.matchedKeywords)}`);
    logger.info(`[lead] url=${post.url}`);

    const alreadyNotified = await dedupeService.hasBeenNotified(post);
    if (alreadyNotified) {
      alreadyNotifiedCount += 1;
      logger.info("[lead] status=already-notified");
      continue;
    }

    logger.info("[lead] status=new");

    try {
      await mailService.sendLeadAlert(post);
      await dedupeService.markAsNotified(post);
      sentCount += 1;
      logger.info("[lead] notification=sent");
    } catch (error) {
      notificationErrors += 1;
      logger.error(
        `Invio email fallito per ${post.source}:${post.sourceId}`,
        error,
      );
    }
  }

  const totalErrors = sourceRun.sourceErrors + notificationErrors;
  logger.info(`Total posts fetched: ${totalFetchedPosts}`);
  logger.info(`Total posts after internal dedupe: ${uniquePosts.length}`);
  logger.info(`Total posts above threshold: ${scoredPosts.length}`);
  logger.info(`Total posts already notified: ${alreadyNotifiedCount}`);
  logger.info(`Total new notifications: ${sentCount}`);
  logger.info(`Total errors: ${totalErrors}`);
}

run().catch((error) => {
  logger.error("Errore non gestito durante l'esecuzione", error);
  process.exitCode = 1;
});
