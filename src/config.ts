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

function getSubredditsFromEnv(): string[] {
  const raw = process.env.SUBREDDITS?.trim();
  if (!raw) {
    return DEFAULT_SUBREDDITS;
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  subreddits: getSubredditsFromEnv(),
  positiveKeywords: POSITIVE_KEYWORDS,
  negativeKeywords: NEGATIVE_KEYWORDS,
  minScore: Number(process.env.MIN_SCORE ?? "5"),
  redditUserAgent: getRequiredEnv("REDDIT_USER_AGENT"),
  brevo: {
    apiKey: getRequiredEnv("BREVO_API_KEY"),
  },
  email: {
    from: getRequiredEnv("ALERT_EMAIL_FROM"),
    to: getRequiredEnv("ALERT_EMAIL_TO"),
  },
};
