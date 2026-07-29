import { LeadPost } from "../models/lead-post";
import { fetchRecentRedditPosts } from "../sources/reddit.source";
import { logger } from "./logger.service";

interface SourceRunnerConfig {
  subreddits: string[];
  rssFeeds: string[];
  redditUserAgent: string;
  sources: {
    redditEnabled: boolean;
    rssEnabled: boolean;
    hackerNewsEnabled: boolean;
    facebookPageEnabled: boolean;
    facebookMessengerEnabled: boolean;
  };
}

interface SourceRunStats {
  posts: LeadPost[];
  sourceErrors: number;
}

interface SourceFetchResult {
  posts: LeadPost[];
  errors: number;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Errore sconosciuto";
}

async function fetchRssStub(_feeds: string[]): Promise<SourceFetchResult> {
  return { posts: [], errors: 0 };
}

async function fetchHackerNewsStub(): Promise<SourceFetchResult> {
  return { posts: [], errors: 0 };
}

async function fetchFacebookPageStub(): Promise<SourceFetchResult> {
  return { posts: [], errors: 0 };
}

async function fetchFacebookMessengerStub(): Promise<SourceFetchResult> {
  return { posts: [], errors: 0 };
}

export async function runSources(cfg: SourceRunnerConfig): Promise<SourceRunStats> {
  const allPosts: LeadPost[] = [];
  let sourceErrors = 0;

  const sources: Array<{
    key: string;
    enabled: boolean;
    fetcher: () => Promise<SourceFetchResult>;
  }> = [
    {
      key: "reddit",
      enabled: cfg.sources.redditEnabled,
      fetcher: () =>
        fetchRecentRedditPosts(cfg.subreddits, cfg.redditUserAgent),
    },
    {
      key: "rss",
      enabled: cfg.sources.rssEnabled,
      fetcher: () => fetchRssStub(cfg.rssFeeds),
    },
    {
      key: "hacker-news",
      enabled: cfg.sources.hackerNewsEnabled,
      fetcher: () => fetchHackerNewsStub(),
    },
    {
      key: "facebook-page",
      enabled: cfg.sources.facebookPageEnabled,
      fetcher: () => fetchFacebookPageStub(),
    },
    {
      key: "facebook-messenger",
      enabled: cfg.sources.facebookMessengerEnabled,
      fetcher: () => fetchFacebookMessengerStub(),
    },
  ];

  for (const source of sources) {
    logger.info(`[${source.key}] Fetch started`);

    if (!source.enabled) {
      logger.info(`[${source.key}] Fetch completed: 0 posts (disabled)`);
      continue;
    }

    try {
      const result = await source.fetcher();
      allPosts.push(...result.posts);
      sourceErrors += result.errors;
      logger.info(`[${source.key}] Fetch completed: ${result.posts.length} posts`);
      if (result.errors > 0) {
        logger.warn(`[${source.key}] Fetch errors: ${result.errors}`);
      }
    } catch (error) {
      sourceErrors += 1;
      logger.error(`[${source.key}] Fetch failed: ${errorMessage(error)}`);
      logger.info(`[${source.key}] Fetch completed: 0 posts`);
    }
  }

  return {
    posts: allPosts,
    sourceErrors,
  };
}
