import axios from "axios";
import { LeadPost } from "../models/lead-post";

interface BrevoMailConfig {
  apiKey: string;
  from: string;
  to: string;
}

function truncateText(input: string, maxLength = 280): string {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength - 3)}...`;
}

export class BrevoMailService {
  private readonly endpoint = "https://api.brevo.com/v3/smtp/email";

  constructor(private readonly cfg: BrevoMailConfig) {}

  async sendLeadAlert(post: LeadPost): Promise<void> {
    const summary = truncateText(post.text || "(nessun testo)");
    const keywordList = (post.matchedKeywords ?? []).join(", ") || "nessuna";

    await axios.post(
      this.endpoint,
      {
        sender: {
          email: this.cfg.from,
          name: "IT Lead Radar",
        },
        to: [{ email: this.cfg.to }],
        subject: "Nuovo possibile lead informatico trovato",
        textContent:
          `Titolo: ${post.title}\n` +
          `Fonte: ${post.source}\n` +
          `Subreddit: ${post.subreddit ?? "n/d"}\n` +
          `Punteggio: ${post.score ?? 0}\n` +
          `Keyword trovate: ${keywordList}\n` +
          `Testo: ${summary}\n` +
          `Link: ${post.url}`,
        htmlContent: `
          <h3>Nuovo possibile lead informatico trovato</h3>
          <p><strong>Titolo:</strong> ${post.title}</p>
          <p><strong>Fonte:</strong> ${post.source}</p>
          <p><strong>Subreddit:</strong> ${post.subreddit ?? "n/d"}</p>
          <p><strong>Punteggio:</strong> ${post.score ?? 0}</p>
          <p><strong>Keyword trovate:</strong> ${keywordList}</p>
          <p><strong>Testo:</strong> ${summary}</p>
          <p><a href="${post.url}" target="_blank" rel="noreferrer">Apri post</a></p>
        `,
      },
      {
        headers: {
          "api-key": this.cfg.apiKey,
          "content-type": "application/json",
        },
        timeout: 15000,
      },
    );
  }
}
