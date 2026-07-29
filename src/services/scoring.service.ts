import { LeadPost } from "../models/lead-post";

const LOCAL_HINTS = ["milano", "lombardia", "zona", "vicino", "quartiere"];

export interface ScoringResult {
  score: number;
  matchedKeywords: string[];
}

function includesKeyword(content: string, keyword: string): boolean {
  return content.includes(keyword.toLowerCase());
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
    if (includesKeyword(combined, keyword)) {
      score -= 5;
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
