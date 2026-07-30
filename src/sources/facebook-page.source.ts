import axios from "axios";
import { LeadPost } from "../models/lead-post";
import { logger } from "../services/logger.service";
import { LeadSource } from "./lead-source";

interface FacebookPageSourceConfig {
  graphApiVersion: string;
  pageId: string;
  pageAccessToken: string;
}

interface FacebookPagePostItem {
  id?: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  comments?: {
    data?: Array<{
      message?: string;
    }>;
  };
  from?: {
    name?: string;
  };
}

interface FacebookGraphResponse {
  data?: FacebookPagePostItem[];
}

function getStatusCode(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = (
      error.response?.data as { error?: { message?: string } } | undefined
    )?.error?.message;
    return apiMessage || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Errore sconosciuto";
}

function buildPostText(item: FacebookPagePostItem): string {
  const postMessage = item.message ?? "";
  const commentMessages = (item.comments?.data ?? [])
    .map((comment) => comment.message?.trim())
    .filter((value): value is string => Boolean(value));

  if (commentMessages.length === 0) {
    return postMessage;
  }

  return `${postMessage}\n\nCommenti:\n- ${commentMessages.join("\n- ")}`;
}

export class FacebookPageSource implements LeadSource {
  constructor(private readonly cfg: FacebookPageSourceConfig) {}

  async fetchPosts(): Promise<LeadPost[]> {
    if (!this.cfg.pageId || !this.cfg.pageAccessToken) {
      logger.warn(
        "[facebook-page] Configurazione incompleta. Imposta FACEBOOK_PAGE_ID e FACEBOOK_PAGE_ACCESS_TOKEN.",
      );
      return [];
    }

    const endpoint = `https://graph.facebook.com/${this.cfg.graphApiVersion}/${this.cfg.pageId}/posts`;

    try {
      const response = await axios.get<FacebookGraphResponse>(endpoint, {
        params: {
          fields:
            "id,message,created_time,permalink_url,from,comments.limit(5){message}",
          limit: 25,
          access_token: this.cfg.pageAccessToken,
        },
        timeout: 15000,
      });

      const items = response.data?.data ?? [];
      return items
        .filter((item) => item.id)
        .map((item) => ({
          id: `facebook-page:${item.id}`,
          source: "facebook-page",
          sourceId: item.id as string,
          title: (item.message ?? "Post Facebook Page")
            .split("\n")[0]
            .slice(0, 120),
          text: buildPostText(item),
          url:
            item.permalink_url ||
            `https://www.facebook.com/${this.cfg.pageId}/posts/${item.id}`,
          author: item.from?.name,
          createdAt: item.created_time,
        }));
    } catch (error) {
      const status = getStatusCode(error);
      const message = getErrorMessage(error);
      if (status === 400 || status === 401 || status === 403) {
        logger.error(
          `[facebook-page] Graph API error ${status}: ${message}. Verifica token e permessi Meta.`,
        );
      } else {
        logger.error(`[facebook-page] Fetch error: ${message}`);
      }
      return [];
    }
  }
}
