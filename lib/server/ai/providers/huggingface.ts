/**
 * Hugging Face AI Provider Implementation
 * Uses the new router.huggingface.co endpoint
 */

import { AIProvider } from "./base";
import { TriviaQuestion } from "../types";
import { PromptResult } from "../prompt-builder";
import { createLogger } from "../../logger";

const logger = createLogger("AI");

export class HuggingFaceProvider implements AIProvider {
  readonly name = "Hugging Face";
  private readonly apiKey: string | null;
  private readonly model: string = "mistralai/Mistral-7B-Instruct-v0.2";

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || null;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(
    prompt: PromptResult,
    questionCount: number
  ): Promise<TriviaQuestion | TriviaQuestion[] | null> {
    if (!this.apiKey) {
      logger.log("🤖 [HF] API key not configured, skipping");
      return null;
    }

    try {
      logger.log(`🤖 [HF] Trying Hugging Face API with ${this.model}...`);
      
      // Use the new router endpoint
      const response = await fetch(
        `https://router.huggingface.co/models/${this.model}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            inputs: prompt.userPrompt,
            parameters: {
              max_new_tokens: questionCount > 1 ? 2000 : 500, // More tokens for batches
              temperature: 0.7,
              return_full_text: false,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`⚠️ [HF] API error: ${response.status}`, errorText.substring(0, 200));
        return null;
      }

      const data = await response.json();
      // HF API returns array with generated_text
      const text = Array.isArray(data) && data[0]?.generated_text 
        ? data[0].generated_text 
        : typeof data === "string" 
          ? data 
          : data.generated_text || data[0]?.generated_text;

      if (!text) {
        logger.warn("⚠️ [HF] No generated text in response");
        return null;
      }

      logger.log("✅ [HF] Success! Response:", text.substring(0, 500));
      const result = this.parseResponse(text, questionCount > 1);
      return result;
    } catch (error) {
      logger.warn("⚠️ [HF] Error:", error instanceof Error ? error.message : "Unknown error");
      return null;
    }
  }

  private parseResponse(text: string, isBatch: boolean): TriviaQuestion | TriviaQuestion[] {
    // Clean the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleanedText);

    if (isBatch) {
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid batch structure: missing questions array");
      }

      const questions: TriviaQuestion[] = [];
      for (const q of parsed.questions) {
        if (
          !q.question ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          typeof q.correctAnswerIndex !== "number" ||
          q.correctAnswerIndex < 0 ||
          q.correctAnswerIndex > 3 ||
          !q.funFact
        ) {
          logger.warn("⚠️ [HF] Invalid question in batch, skipping:", q);
          continue;
        }
        questions.push(q as TriviaQuestion);
      }

      if (questions.length === 0) {
        throw new Error("No valid questions in batch");
      }

      return questions;
    } else {
      const trivia: TriviaQuestion = parsed;

      if (
        !trivia.question ||
        !Array.isArray(trivia.options) ||
        trivia.options.length !== 4 ||
        typeof trivia.correctAnswerIndex !== "number" ||
        trivia.correctAnswerIndex < 0 ||
        trivia.correctAnswerIndex > 3 ||
        !trivia.funFact
      ) {
        throw new Error("Invalid trivia structure");
      }

      return trivia;
    }
  }
}
