/**
 * Gemini AI Provider Implementation
 */

import { AIProvider } from "./base";
import { TriviaQuestion } from "../types";
import { PromptResult } from "../prompt-builder";
import { createLogger } from "../../logger";

const logger = createLogger("AI");

export class GeminiProvider implements AIProvider {
  readonly name = "Gemini";
  private readonly apiKey: string | null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(
    prompt: PromptResult,
    questionCount: number
  ): Promise<TriviaQuestion | TriviaQuestion[] | null> {
    if (!this.apiKey) {
      logger.log("🤖 [GEMINI] API key not configured, skipping");
      return null;
    }

    logger.log("🤖 [GEMINI] Trying Gemini API...");

    // Updated model names based on Gemini API changelog (Jan 2026)
    const modelNames = [
      "gemini-2.5-flash",        // Stable, fast model
      "gemini-3-flash-preview", // Latest preview
      "gemini-2.5-pro",         // Stable, powerful model
      "gemini-3-pro-preview",   // Latest preview
    ];

    for (const modelName of modelNames) {
      try {
        logger.log(`🤖 [GEMINI] Trying REST API v1 with model: ${modelName}`);
        const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt.userPrompt }]
            }]
          }),
        });

        logger.log(`🤖 [GEMINI] REST API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          // Check for quota exceeded
          if (response.status === 429 || errorText.includes("quota") || errorText.includes("Quota")) {
            logger.warn(`⚠️ [GEMINI] Quota exceeded for ${modelName}, trying alternatives...`);
            break; // Exit Gemini loop, try alternatives
          }
          logger.warn(`⚠️ [GEMINI] REST API model ${modelName} failed:`, response.status, errorText.substring(0, 200));
          continue;
        }

        const data = await response.json();
        logger.log(`✅ [GEMINI] REST API model ${modelName} worked!`);

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          logger.warn(`⚠️ [GEMINI] No text in response for ${modelName}`);
          continue;
        }

        logger.log("Gemini raw response:", text.substring(0, 500));

        try {
          const result = this.parseResponse(text, questionCount > 1);
          return result;
        } catch (parseError) {
          logger.error("JSON parse/validation error:", parseError);
          logger.error("Failed to parse text:", text.substring(0, 500));
          continue;
        }
      } catch (error) {
        logger.warn(`⚠️ [GEMINI] REST API model ${modelName} failed:`, error instanceof Error ? error.message : "Unknown error");
        continue;
      }
    }

    // Try SDK as fallback
    try {
      logger.log("🤖 [GEMINI] REST API failed, trying SDK as fallback...");
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(this.apiKey);

      for (const modelName of modelNames) {
        try {
          logger.log(`🤖 [GEMINI] Trying SDK model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt.userPrompt);
          const response = await result.response;
          const text = response.text();

          if (!text) {
            logger.warn(`⚠️ [GEMINI] No text in SDK response for ${modelName}`);
            continue;
          }

          logger.log("✅ [GEMINI] SDK model worked!");
          const parsed = this.parseResponse(text, questionCount > 1);
          return parsed;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          if (errorMessage.includes("quota") || errorMessage.includes("429")) {
            logger.warn("⚠️ [GEMINI] Quota exceeded, trying alternatives...");
            break;
          }
          logger.warn(`⚠️ [GEMINI] SDK model ${modelName} failed:`, errorMessage);
          continue;
        }
      }
    } catch (error) {
      logger.warn("⚠️ [GEMINI] SDK fallback failed:", error instanceof Error ? error.message : "Unknown error");
    }

    return null;
  }

  private parseResponse(text: string, isBatch: boolean): TriviaQuestion | TriviaQuestion[] {
    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    logger.log("Cleaned text:", cleanedText.substring(0, 500));

    const parsed = JSON.parse(cleanedText);

    if (isBatch) {
      // Batch format: { questions: [...] }
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
          logger.warn("⚠️ [GEMINI] Invalid question in batch, skipping:", q);
          continue;
        }
        questions.push(q as TriviaQuestion);
      }

      if (questions.length === 0) {
        throw new Error("No valid questions in batch");
      }

      return questions;
    } else {
      // Single question format
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
