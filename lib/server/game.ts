"use server";

import { generateTriviaFromContent, TriviaQuestion } from "./ai/index";
import { createLogger } from "./logger";

const logger = createLogger("AI");

/**
 * Server action that only handles AI generation
 * Wikipedia fetch is now done client-side to avoid blocking
 */
export async function generateTriviaFromContentServer(
  content: string,
  previousQuestions: string[] = [],
  previousAnswerIndices: number[] = []
): Promise<{ trivia: TriviaQuestion | null; error: string | null }> {
  logger.log("🤖 [AI] generateTriviaFromContentServer called");
  logger.log("📊 [AI] Content length:", content?.length || 0);
  logger.log("📊 [AI] Content preview:", content?.substring(0, 200) || "No content");
  logger.log("📊 [AI] Previous questions count:", previousQuestions.length);
  logger.log("📊 [AI] Previous answer indices:", previousAnswerIndices);

  try {
    if (!content || !content.trim()) {
      logger.error("❌ [AI] No content provided");
      return {
        trivia: null,
        error: "No se proporcionó contenido para generar la trivia.",
      };
    }

    logger.log("📤 [AI] Calling generateTriviaFromContent...");
    // Generate trivia from content with previous questions context (single question)
    const result = await generateTriviaFromContent(content.trim(), previousQuestions, previousAnswerIndices, 1);

    logger.log("📥 [AI] generateTriviaFromContent returned");
    
    // Handle single question response
    let trivia: TriviaQuestion | null = null;
    if (Array.isArray(result)) {
      // Should not happen when questionCount=1, but handle it
      trivia = result[0] || null;
    } else {
      trivia = result;
    }

    logger.log("📊 [AI] Trivia exists:", !!trivia);

    if (!trivia) {
      logger.error("❌ [AI] No trivia generated");
      return {
        trivia: null,
        error: "Error al generar la trivia. Intenta de nuevo.",
      };
    }

    logger.log("✅ [AI] Trivia generated successfully");
    logger.log("📊 [AI] Trivia question:", trivia.question);
    logger.log("📊 [AI] Trivia options count:", trivia.options.length);
    logger.log("📊 [AI] Trivia correct index:", trivia.correctAnswerIndex);
    logger.log("📊 [AI] Trivia fun fact:", trivia.funFact);

    return { trivia, error: null };
  } catch (error) {
    console.error("💥 [AI] Exception in generateTriviaFromContentServer:", error);
    if (error instanceof Error) {
      console.error("💥 [AI] Error message:", error.message);
      console.error("💥 [AI] Error stack:", error.stack);

      if (error.message === "RATE_LIMIT") {
        logger.error("⏳ [AI] Rate limit/quota issue detected");
        return {
          trivia: null,
          error: "RATE_LIMIT", // Special error code for rate limiting
        };
      }

      // Return more specific error message
      if (error.message.includes("API key") && !error.message.includes("quota")) {
        logger.error("🔑 [AI] API key configuration issue detected");
        return {
          trivia: null,
          error: "Error de configuración: API key de Gemini no válida. Verifica tu .env.local",
        };
      }
      if (error.message.includes("quota") || error.message.includes("429") || error.message.includes("rate limit")) {
        logger.error("⏳ [AI] Rate limit/quota issue detected");
        return {
          trivia: null,
          error: "RATE_LIMIT", // Special error code for rate limiting
        };
      }
      if (error.message.includes("JSON") || error.message.includes("parse")) {
        logger.error("📄 [AI] JSON parsing issue detected");
        return {
          trivia: null,
          error: "Error al procesar la respuesta de la IA. Intenta con otro tema.",
        };
      }
    }
    return {
      trivia: null,
      error: "Error al generar la trivia. Intenta de nuevo.",
    };
  }
}

/**
 * Generate multiple questions in batch - TRUE BATCHING (single API call)
 */
export async function generateTriviaBatch(
  content: string,
  count: number,
  previousQuestions: string[] = [],
  previousAnswerIndices: number[] = []
): Promise<{ questions: TriviaQuestion[]; errors: string[] }> {
  logger.log(`🔄 [AI] Generating batch of ${count} questions in SINGLE API call`);
  const questions: TriviaQuestion[] = [];
  const errors: string[] = [];

  const runSequentialFallback = async () => {
    logger.warn("⚠️ [AI] Batch generation failed, falling back to sequential generation");
    let currentQuestions = [...previousQuestions];
    let currentIndices = [...previousAnswerIndices];

    for (let i = 0; i < count && questions.length < count; i++) {
      try {
        const result = await generateTriviaFromContentServer(
          content,
          currentQuestions,
          currentIndices
        );

        if (result.trivia) {
          const isDuplicate = currentQuestions.some(
            (q) => q.toLowerCase().trim() === result.trivia!.question.toLowerCase().trim()
          );

          if (!isDuplicate) {
            questions.push(result.trivia);
            currentQuestions.push(result.trivia.question);
            currentIndices.push(result.trivia.correctAnswerIndex);
          }
        } else if (result.error === "RATE_LIMIT") {
          logger.warn(`⚠️ [AI] Rate limit hit after ${questions.length} questions`);
          errors.push("RATE_LIMIT");
          break;
        }

        // Small delay between requests
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        logger.error(`❌ [AI] Error generating question ${i + 1} in fallback:`, err);
      }
    }
  };

  try {
    // Try to generate all questions in a single API call
    const batchResult = await generateTriviaFromContent(
      content,
      previousQuestions,
      previousAnswerIndices,
      count
    );

    if (Array.isArray(batchResult)) {
      // Batch response - multiple questions in one call
      logger.log(`✅ [AI] Received ${batchResult.length} questions in single batch`);
      
      // Filter duplicates and validate
      for (const trivia of batchResult) {
        const isDuplicate = previousQuestions.some(
          (q) => q.toLowerCase().trim() === trivia.question.toLowerCase().trim()
        );

        if (!isDuplicate) {
          questions.push(trivia);
        } else {
          logger.warn(`⚠️ [AI] Duplicate question in batch, skipping: ${trivia.question.substring(0, 50)}`);
          errors.push("Duplicate question skipped");
        }
      }
    } else if (batchResult) {
      // Single question response (fallback)
      logger.log("⚠️ [AI] Received single question instead of batch, using it");
      questions.push(batchResult);
    } else {
      errors.push("Failed to generate batch");
      await runSequentialFallback();
    }
  } catch (error) {
    logger.error(`❌ [AI] Error generating batch:`, error);
    errors.push(error instanceof Error ? error.message : "Unknown error");
    await runSequentialFallback();
  }

  logger.log(`✅ [AI] Batch generation complete: ${questions.length}/${count} questions generated`);
  return { questions, errors };
}
