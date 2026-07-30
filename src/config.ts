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
  "mi serve un informatico",
  "conoscete un informatico",
  "qualcuno conosce un informatico",
  "cerco programmatore",
  "cerco sviluppatore",
  "mi serve un sito",
  "qualcuno sa fare un sito",
  "qualcuno mi aiuta con il pc",
  "devo fare un sito",
  "devo creare un sito",
  "devo rifare il sito",
  "cerco webmaster",
  "tecnico informatico",
  "tecnico pc",
  "tecnico computer",
  "ho bisogno di un tecnico",
  "assistenza pc",
  "assistenza informatica",
  "riparazione pc",
  "problema con computer",
  "problema con pc",
  "problema con rete",
  "sviluppare app",
  "creare app",
  "sviluppare sito",
  "sviluppare gestionale",
  "sviluppare software",
  "ecommerce",
  "e-commerce",
  "cerco qualcuno per ecommerce",
  "cerco qualcuno per e-commerce",
  "sito web",
  "cerco persona per sito web",
  "aiuto sito web",
  "preventivo sito web",
  "sito per attivita",
  "sito per attività",
  "sito per negozio",
  "sito per ristorante",
  "sito per professionista",
  "gestionale",
  "mi serve un gestionale",
  "preventivo gestionale",
  "preventivo app",
  "automazione excel",
  "automazione fogli google",
  "database",
  "database clienti",
  "crm",
  "crm semplice",
  "landing page",
  "configurare rete",
  "configurazione email aziendale",
  "gestione dominio",
  "gestione hosting",
  "consulente informatico",
  "consulenza informatica",
  "freelance informatico",
];

const NEGATIVE_KEYWORDS = [
  "cerco lavoro",
  "offerta di lavoro",
  "siamo alla ricerca",
  "assumiamo",
  "posizione aperta",
  "ral",
  "contratto",
  "curriculum",
  "candidatura",
  "colloquio",
  "stipendio",
  "stage",
  "tirocinio",
  "junior developer",
  "senior developer",
  "remote job",
  "università",
  "universita",
  "esame",
  "corso",
  "bootcamp",
  "offerta lavoro",
  "assunzione",
  "hiring",
  "job offer",
];

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
    facebookPersonalFeedEnabled: parseBoolean(
      process.env.FACEBOOK_PERSONAL_FEED_ENABLED,
      false,
    ),
    facebookGroupsEnabled: parseBoolean(
      process.env.FACEBOOK_GROUPS_ENABLED,
      false,
    ),
  },
  redditUserAgent:
    process.env.REDDIT_USER_AGENT || "it-lead-radar/1.0 by Federico",
  facebook: {
    graphApiVersion: process.env.FACEBOOK_GRAPH_API_VERSION || "v26.0",
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
