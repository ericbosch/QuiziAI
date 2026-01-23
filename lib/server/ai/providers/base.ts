/**
 * Base interface for AI providers
 * All providers must implement this interface
 */

import { TriviaQuestion } from "../types";
import { PromptResult } from "../prompt-builder";

export interface AIProvider {
  /**
   * Provider name for logging
   */
  readonly name: string;

  /**
   * Check if provider is available (API key configured)
   */
  isAvailable(): boolean;

  /**
   * Generate trivia from prompt
   * @param prompt - The prompt to send to the AI
   * @param questionCount - Number of questions to generate (for batch mode)
   * @returns TriviaQuestion(s) or null if failed
   */
  generate(
    prompt: PromptResult,
    questionCount: number
  ): Promise<TriviaQuestion | TriviaQuestion[] | null>;
}
