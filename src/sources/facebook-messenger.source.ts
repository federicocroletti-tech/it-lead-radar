import axios from "axios";
import { LeadPost } from "../models/lead-post";
import { logger } from "../services/logger.service";
import { LeadSource } from "./lead-source";

interface FacebookMessengerSourceConfig {
  graphApiVersion: string;
  pageId: string;
  pageAccessToken: string;
}

interface ConversationItem {
  id?: string;
  updated_time?: string;
  messages?: {
    data?: Array<{
      message?: string;
      created_time?: string;
      from?: {
        name?: string;
      };
    }>;
  };
}

interface MessengerResponse {
  data?: ConversationItem[];
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

export class FacebookMessengerSource implements LeadSource {
  constructor(private readonly cfg: FacebookMessengerSourceConfig) {}

  async fetchPosts(): Promise<LeadPost[]> {
    if (!this.cfg.pageId || !this.cfg.pageAccessToken) {
      logger.warn(
        "[facebook-messenger] Configurazione incompleta. Imposta FACEBOOK_PAGE_ID e FACEBOOK_PAGE_ACCESS_TOKEN.",
      );
      return [];
    }

    const endpoint = `https://graph.facebook.com/${this.cfg.graphApiVersion}/${this.cfg.pageId}/conversations`;

    try {
      const response = await axios.get<MessengerResponse>(endpoint, {
        params: {
          fields:
            "id,updated_time,messages.limit(5){message,created_time,from}",
          limit: 25,
          access_token: this.cfg.pageAccessToken,
        },
        timeout: 15000,
      });

      const items = response.data?.data ?? [];
      return items
        .filter((item) => item.id)
        .flatMap((item) => {
          const messages = item.messages?.data ?? [];
          if (messages.length === 0) {
            return [
              {
                id: `facebook-messenger:${item.id}`,
                source: "facebook-messenger",
                sourceId: item.id as string,
                title: `Conversazione Messenger Page ${item.id}`,
                text: "Conversazione Messenger senza testo disponibile",
                url: `https://business.facebook.com/latest/inbox/${item.id}`,
                createdAt: item.updated_time,
              },
            ];
          }

          return messages.map((message, index) => ({
            id: `facebook-messenger:${item.id}:${index}`,
            source: "facebook-messenger",
            sourceId: `${item.id}:${index}`,
            title: `Messaggio Messenger Page ${item.id}`,
            text: message.message ?? "(messaggio vuoto)",
            url: `https://business.facebook.com/latest/inbox/${item.id}`,
            author: message.from?.name,
            createdAt: message.created_time || item.updated_time,
          }));
        });
    } catch (error) {
      const status = getStatusCode(error);
      const message = getErrorMessage(error);
      if (status === 400 || status === 401 || status === 403) {
        logger.error(
          `[facebook-messenger] Graph API error ${status}: ${message}. Verifica token e permessi Messenger Platform.`,
        );
      } else {
        logger.error(`[facebook-messenger] Fetch error: ${message}`);
      }
      return [];
    }
  }
}
