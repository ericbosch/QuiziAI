/**
 * Main AI module - orchestrates multiple providers with fallback
 */

import { TriviaQuestion } from "./types";
import { buildTriviaPrompt, PromptContext } from "./prompt-builder";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import { HuggingFaceProvider } from "./providers/huggingface";
import { AIProvider } from "./providers/base";
import { createLogger } from "../logger";

const logger = createLogger("AI");

// Export types
export type { TriviaQuestion } from "./types";

// Lazy provider initialization (checks env vars at call time)
function getProviders(): AIProvider[] {
  return [
    new GeminiProvider(),
    new GroqProvider(),
    new HuggingFaceProvider(),
  ];
}

/**
 * Generate trivia from content using provider fallback chain
 * If NEXT_PUBLIC_USE_MOCKS is 'true', returns mock data immediately
 */
export async function generateTriviaFromContent(
  content: string,
  previousQuestions: string[] = [],
  previousAnswerIndices: number[] = [],
  questionCount: number = 1
): Promise<TriviaQuestion | TriviaQuestion[] | null> {
  // Check if mocks are enabled
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    logger.log("🎭 [AI] Mock mode enabled, returning mock batch");
    const { getMockBatch } = await import("../../shared/mock-provider");
    const mockBatch = getMockBatch();

    if (questionCount > 1) {
      // Return requested number of questions (or all if less)
      return mockBatch.slice(0, questionCount);
    }
    // Return single question
    return mockBatch[0] || null;
  }

  logger.log("🤖 [AI] Starting trivia generation");
  logger.log("📊 [AI] Content length:", content.length);
  logger.log("📊 [AI] Previous questions:", previousQuestions.length);
  logger.log("📊 [AI] Question count:", questionCount);

  // Build unified prompt
  const promptContext: PromptContext = {
    previousQuestions,
    previousAnswerIndices,
    questionCount,
    content,
  };

  const prompt = buildTriviaPrompt(promptContext);
  logger.log(`🤖 [AI] Prompt length: ${prompt.userPrompt.length} characters`);

  // Try each provider in order until one succeeds
  const providers = getProviders();
  const availableProviders = providers.filter((provider) => {
    if (!provider.isAvailable()) {
      logger.log(`🤖 [${provider.name}] Provider not available, skipping`);
      return false;
    }
    return true;
  });

  if (availableProviders.length === 0) {
    throw new Error("API key not configured");
  }

  let rateLimitHit = false;
  let lastErrorMessage: string | null = null;

  for (const provider of availableProviders) {
    try {
      logger.log(`🤖 [${provider.name}] Trying ${provider.name} API...`);
      const result = await provider.generate(prompt, questionCount);

      if (result) {
        logger.log(`✅ [${provider.name}] Success! Generated ${Array.isArray(result) ? result.length : 1} question(s)`);
        return result;
      }

      logger.warn(`⚠️ [${provider.name}] No result returned, trying next provider...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      lastErrorMessage = errorMessage;
      logger.warn(`⚠️ [${provider.name}] Error:`, errorMessage);

      const normalizedMessage = errorMessage.toLowerCase();
      if (
        normalizedMessage.includes("429") ||
        normalizedMessage.includes("quota") ||
        normalizedMessage.includes("rate limit") ||
        normalizedMessage.includes("rate_limit")
      ) {
        logger.warn(`⚠️ [${provider.name}] Rate limit/quota issue, trying next provider...`);
        rateLimitHit = true;
      }

      continue;
    }
  }

  if (rateLimitHit) {
    throw new Error("RATE_LIMIT");
  }

  if (lastErrorMessage) {
    logger.error("Error generating trivia:", lastErrorMessage);
  }

  return null;
}
