/**
 * Shared types for AI module
 */

export interface TriviaQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  funFact: string;
}
