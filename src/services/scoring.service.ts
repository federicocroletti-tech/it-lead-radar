import { LeadPost } from "../models/lead-post";

const LOCAL_HINTS = [
  "milano",
  "lombardia",
  "zona",
  "quartiere",
  "provincia",
  "vicino",
];

const INTENT_PHRASES = [
  "cerco",
  "mi serve",
  "ho bisogno",
  "qualcuno sa",
  "qualcuno conosce",
];

const NEED_TERMS = [
  "sito",
  "informatico",
  "pc",
  "gestionale",
  "app",
  "software",
];

export interface ScoringResult {
  score: number;
  matchedKeywords: string[];
}

function includesKeyword(content: string, keyword: string): boolean {
  return content.includes(keyword.toLowerCase());
}

function hasIntentTitleMatch(title: string): boolean {
  const hasIntent = INTENT_PHRASES.some((phrase) =>
    includesKeyword(title, phrase),
  );
  const hasNeedTerm = NEED_TERMS.some((term) => includesKeyword(title, term));
  return hasIntent && hasNeedTerm;
}

export function scorePost(
  post: LeadPost,
  positiveKeywords: string[],
  negativeKeywords: string[],
): ScoringResult {
  const title = (post.title ?? "").toLowerCase();
  const text = (post.text ?? "").toLowerCase();
  const combined = `${title}\n${text}`;

  let score = 0;
  const matched = new Set<string>();

  if (hasIntentTitleMatch(title)) {
    score += 6;
    matched.add("intent:title");
  }

  for (const keyword of positiveKeywords) {
    if (includesKeyword(title, keyword)) {
      score += 5;
      matched.add(keyword);
    }
    if (includesKeyword(text, keyword)) {
      score += 3;
      matched.add(keyword);
    }
  }

  for (const hint of LOCAL_HINTS) {
    if (includesKeyword(combined, hint)) {
      score += 2;
      matched.add(`locale:${hint}`);
    }
  }

  for (const keyword of negativeKeywords) {
    if (includesKeyword(title, keyword)) {
      score -= 6;
    }
    if (includesKeyword(text, keyword)) {
      score -= 4;
    }
  }

  return {
    score,
    matchedKeywords: Array.from(matched),
  };
}

export function isRelevant(score: number, minScore: number): boolean {
  return score >= minScore;
}
