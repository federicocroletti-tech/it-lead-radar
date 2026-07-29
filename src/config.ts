import dotenv from "dotenv";

dotenv.config();

const DEFAULT_SUBREDDITS = [
  "italy",
  "milano",
  "ItaliaPersonalFinance",
  "programmazione",
  "ItalyInformatica",
  "webdev",
  "freelance",
  "smallbusiness",
  "Entrepreneur",
  "forhire",
];

const POSITIVE_KEYWORDS = [
  "cerco informatico",
  "cerco programmatore",
  "cerco sviluppatore",
  "mi serve un sito",
  "devo fare un sito",
  "cerco webmaster",
  "tecnico informatico",
  "assistenza pc",
  "riparazione pc",
  "sviluppare app",
  "creare app",
  "ecommerce",
  "e-commerce",
  "sito web",
  "gestionale",
  "automazione excel",
  "database",
  "crm",
  "landing page",
  "configurare rete",
  "consulente informatico",
  "freelance informatico",
];

const NEGATIVE_KEYWORDS = [
  "cerco lavoro",
  "curriculum",
  "stipendio",
  "stage",
  "tirocinio",
  "università",
  "esame",
  "corso",
  "offerta lavoro",
  "assunzione",
  "hiring",
  "job offer",
];

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variabile ambiente mancante: ${name}`);
  }
  return value;
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parseCsv(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSubredditsFromEnv(): string[] {
  const raw =
    process.env.REDDIT_SUBREDDITS?.trim() ?? process.env.SUBREDDITS?.trim();
  if (!raw) {
    return DEFAULT_SUBREDDITS;
  }

  return parseCsv(raw);
}

function getRssFeedsFromEnv(): string[] {
  return parseCsv(process.env.RSS_FEEDS?.trim());
}

export const config = {
  subreddits: getSubredditsFromEnv(),
  rssFeeds: getRssFeedsFromEnv(),
  positiveKeywords: POSITIVE_KEYWORDS,
  negativeKeywords: NEGATIVE_KEYWORDS,
  minScore: Number(process.env.MIN_SCORE ?? "5"),
  dryRun: parseBoolean(process.env.DRY_RUN, true),
  sources: {
    redditEnabled: parseBoolean(process.env.REDDIT_ENABLED, true),
    rssEnabled: parseBoolean(process.env.RSS_ENABLED, false),
    hackerNewsEnabled: parseBoolean(process.env.HACKER_NEWS_ENABLED, false),
    facebookPageEnabled: parseBoolean(process.env.FACEBOOK_PAGE_ENABLED, false),
    facebookMessengerEnabled: parseBoolean(
      process.env.FACEBOOK_MESSENGER_ENABLED,
      false,
    ),
  },
  redditUserAgent: getRequiredEnv("REDDIT_USER_AGENT"),
  facebook: {
    graphApiVersion: process.env.FACEBOOK_GRAPH_API_VERSION || "v22.0",
    pageId: process.env.FACEBOOK_PAGE_ID || "",
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "",
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || "",
  },
  email: {
    from: process.env.ALERT_EMAIL_FROM || "",
    to: process.env.ALERT_EMAIL_TO || "",
  },
};
