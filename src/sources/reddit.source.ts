import axios from "axios";
import { LeadPost } from "../models/lead-post";
import { logger } from "../services/logger.service";

interface RedditListingResponse {
  data?: {
    children?: Array<{
      data?: {
        id?: string;
        name?: string;
        title?: string;
        selftext?: string;
        author?: string;
        created_utc?: number;
        subreddit?: string;
        permalink?: string;
      };
    }>;
  };
}

interface RedditPostData {
  id?: string;
  name?: string;
  title?: string;
  selftext?: string;
  author?: string;
  created_utc?: number;
  subreddit?: string;
  permalink?: string;
}

export interface RedditFetchResult {
  posts: LeadPost[];
  errors: number;
}

function mapRedditItemToLead(
  item: RedditPostData | undefined,
): LeadPost | null {
  if (!item?.id || !item?.title) {
    return null;
  }

  const sourceId = item.name || `t3_${item.id}`;
  const permalink = item.permalink ?? "";
  const url = permalink.startsWith("http")
    ? permalink
    : `https://www.reddit.com${permalink}`;

  return {
    id: `reddit:${sourceId}`,
    source: "reddit",
    sourceId,
    title: item.title,
    text: item.selftext ?? "",
    url,
    author: item.author,
    createdAt: item.created_utc
      ? new Date(item.created_utc * 1000).toISOString()
      : undefined,
    subreddit: item.subreddit,
  };
}

export async function fetchRecentRedditPosts(
  subreddits: string[],
  userAgent: string,
  limit = 25,
): Promise<RedditFetchResult> {
  const allPosts: LeadPost[] = [];
  let errors = 0;

  for (const subreddit of subreddits) {
    const endpoint = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=${limit}`;

    try {
      const response = await axios.get<RedditListingResponse>(endpoint, {
        headers: {
          "User-Agent": userAgent,
        },
        timeout: 15000,
      });

      const children = response.data?.data?.children ?? [];
      for (const child of children) {
        const mapped = mapRedditItemToLead(child.data);
        if (mapped) {
          allPosts.push(mapped);
        }
      }
    } catch (error) {
      errors += 1;
      const message = error instanceof Error ? error.message : "Errore sconosciuto";
      logger.warn(`[reddit] Subreddit fetch failed (${subreddit}): ${message}`);
    }
  }

  return {
    posts: allPosts,
    errors,
  };
}
