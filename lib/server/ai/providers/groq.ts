/**
 * Groq AI Provider Implementation
 */

import { AIProvider } from "./base";
import { TriviaQuestion } from "../types";
import { PromptResult } from "../prompt-builder";
import { createLogger } from "../../logger";

const logger = createLogger("AI");

export class GroqProvider implements AIProvider {
  readonly name = "Groq";
  private readonly apiKey: string | null;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || null;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(
    prompt: PromptResult,
    questionCount: number
  ): Promise<TriviaQuestion | TriviaQuestion[] | null> {
    if (!this.apiKey) {
      logger.log("🤖 [GROQ] API key not configured, skipping");
      return null;
    }

    try {
      logger.log("🤖 [GROQ] Trying Groq API with Llama 3.1 8B...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: prompt.systemPrompt || "Eres un generador de preguntas de trivia. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones.",
            },
            {
              role: "user",
              content: prompt.userPrompt.includes("Contenido sobre el que crear la trivia:") 
                ? prompt.userPrompt.split("Contenido sobre el que crear la trivia:")[1]?.trim() || prompt.userPrompt
                : prompt.userPrompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`⚠️ [GROQ] API error: ${response.status}`, errorText.substring(0, 200));
        return null;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        logger.warn("⚠️ [GROQ] No content in response");
        return null;
      }

      logger.log("✅ [GROQ] Success! Response:", text.substring(0, 500));
      const result = this.parseResponse(text, questionCount > 1);
      return result;
    } catch (error) {
      logger.warn("⚠️ [GROQ] Error:", error instanceof Error ? error.message : "Unknown error");
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
          logger.warn("⚠️ [GROQ] Invalid question in batch, skipping:", q);
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
