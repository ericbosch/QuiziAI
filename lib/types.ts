/**
 * Shared TypeScript types for QuiziAI
 *
 * This file centralizes common types to avoid circular dependencies
 * and provide a single source of truth for type definitions.
 */

export interface TriviaQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  funFact: string;
}

export interface WikipediaSummary {
  title: string;
  extract: string;
  extract_html?: string;
  thumbnail?: {
    source: string;
  };
}
