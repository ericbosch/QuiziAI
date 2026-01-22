"use server";

import { generateTriviaFromContent, TriviaQuestion } from "./ai";
import { createLogger } from "./logger";

const logger = createLogger("AI");

/**
 * Server action that only handles AI generation
 * Wikipedia fetch is now done client-side to avoid blocking
 */
export async function generateTriviaFromContentServer(
  content: string,
  previousQuestions: string[] = []
): Promise<{ trivia: TriviaQuestion | null; error: string | null }> {
  logger.log("🤖 [AI] generateTriviaFromContentServer called");
  logger.log("📊 [AI] Content length:", content?.length || 0);
  logger.log("📊 [AI] Content preview:", content?.substring(0, 200) || "No content");
  logger.log("📊 [AI] Previous questions count:", previousQuestions.length);
  
  try {
    if (!content || !content.trim()) {
      logger.error("❌ [AI] No content provided");
      return {
        trivia: null,
        error: "No se proporcionó contenido para generar la trivia.",
      };
    }

    logger.log("📤 [AI] Calling generateTriviaFromContent...");
    // Generate trivia from content with previous questions context
    const trivia = await generateTriviaFromContent(content.trim(), previousQuestions);
    
    logger.log("📥 [AI] generateTriviaFromContent returned");
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
      
      // Return more specific error message
      if (error.message.includes("API key")) {
        logger.error("🔑 [AI] API key issue detected");
        return {
          trivia: null,
          error: "Error de configuración: API key de Gemini no válida. Verifica tu .env.local",
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
