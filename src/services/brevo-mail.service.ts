import axios from "axios";
import { LeadPost } from "../models/lead-post";

interface BrevoMailConfig {
  apiKey: string;
  from: string;
  to: string;
  dryRun: boolean;
}

function truncateText(input: string, maxLength = 280): string {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength - 3)}...`;
}

export class BrevoMailService {
  private readonly endpoint = "https://api.brevo.com/v3/smtp/email";
  private readonly subject = "Nuovo possibile lead informatico trovato";

  constructor(private readonly cfg: BrevoMailConfig) {}

  private buildTextContent(
    post: LeadPost,
    summary: string,
    keywordList: string,
  ): string {
    return (
      `Titolo: ${post.title}\n` +
      `Fonte: ${post.source}\n` +
      `Subreddit: ${post.subreddit ?? "n/d"}\n` +
      `Punteggio: ${post.score ?? 0}\n` +
      `Keyword trovate: ${keywordList}\n` +
      `Testo: ${summary}\n` +
      `Link: ${post.url}`
    );
  }

  private ensureEmailConfig(): void {
    if (this.cfg.apiKey && this.cfg.to && this.cfg.from) {
      return;
    }

    throw new Error(
      "Configurazione email incompleta: controlla BREVO_API_KEY, ALERT_EMAIL_TO e ALERT_EMAIL_FROM",
    );
  }

  async sendLeadAlert(post: LeadPost): Promise<void> {
    const summary = truncateText(post.text || "(nessun testo)");
    const keywordList = (post.matchedKeywords ?? []).join(", ") || "nessuna";
    const textContent = this.buildTextContent(post, summary, keywordList);

    if (this.cfg.dryRun) {
      console.log("[DRY_RUN] Invio email simulato");
      console.log(`[DRY_RUN] Oggetto: ${this.subject}`);
      console.log(
        `[DRY_RUN] Destinatario: ${this.cfg.to || "(non configurato)"}`,
      );
      console.log(
        `[DRY_RUN] Mittente: ${this.cfg.from || "(non configurato)"}`,
      );
      console.log(`[DRY_RUN] Corpo:\n${textContent}`);
      return;
    }

    this.ensureEmailConfig();

    await axios.post(
      this.endpoint,
      {
        sender: {
          email: this.cfg.from,
          name: "IT Lead Radar",
        },
        to: [{ email: this.cfg.to }],
        subject: this.subject,
        textContent,
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
