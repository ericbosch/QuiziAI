"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createLogger } from "./logger";

const logger = createLogger("AI");

export interface TriviaQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  funFact: string;
}

function buildSystemPrompt(
  previousQuestions: string[] = [],
  previousAnswerIndices: number[] = []
): string {
  let prompt = `Eres un generador de preguntas de trivia. Tu tarea es crear preguntas educativas y entretenidas basadas en el contenido proporcionado.

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.

El formato JSON debe ser exactamente:
{
  "question": "pregunta en español",
  "options": ["opción 1", "opción 2", "opción 3", "opción 4"],
  "correctAnswerIndex": 0,
  "funFact": "dato curioso breve en español"
}

Reglas:
- La pregunta debe ser clara y directa
- Las 4 opciones deben ser plausibles pero solo una correcta
- correctAnswerIndex debe ser 0, 1, 2 o 3 (índice de la opción correcta)
- El funFact debe ser breve (máximo 100 caracteres) y relacionado con la respuesta correcta
- Todo el contenido debe estar en español
- NO incluyas markdown, NO incluyas código, solo el JSON puro
- IMPORTANTE: Varía la posición de la respuesta correcta (correctAnswerIndex). No uses siempre la misma posición.`;

  if (previousQuestions.length > 0) {
    prompt += `\n\nIMPORTANTE: Ya se han hecho las siguientes preguntas sobre este tema. DEBES crear una pregunta COMPLETAMENTE DIFERENTE que no sea similar a ninguna de estas:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nLa nueva pregunta debe cubrir un aspecto diferente del tema y no repetir información ya preguntada.`;
  }

  if (previousAnswerIndices.length > 0) {
    const recentIndices = previousAnswerIndices.slice(-3).join(", ");
    prompt += `\n\nIMPORTANTE: Las últimas respuestas correctas estuvieron en las posiciones: ${recentIndices}. Por favor, usa una posición DIFERENTE para la respuesta correcta (0, 1, 2 o 3) para mantener la variedad.`;
  }

  return prompt;
}

function parseTriviaResponse(text: string): TriviaQuestion {
  // Clean the response - remove markdown code blocks if present
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  
  logger.log("Cleaned text:", cleanedText.substring(0, 500));

  const trivia: TriviaQuestion = JSON.parse(cleanedText);

  // Validate structure
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

/**
 * Try Groq API (Llama 3.1) - Free tier, very fast
 */
async function tryGroqAPI(prompt: string): Promise<TriviaQuestion | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.log("🤖 [GROQ] API key not configured, skipping");
    return null;
  }

  try {
    logger.log("🤖 [GROQ] Trying Groq API with Llama 3.1 8B...");
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Eres un generador de preguntas de trivia. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones.",
          },
          {
            role: "user",
            content: prompt,
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
    const trivia = parseTriviaResponse(text);
    return trivia;
  } catch (error) {
    logger.warn("⚠️ [GROQ] Error:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

/**
 * Try Hugging Face Inference API - Free tier with rate limits
 */
async function tryHuggingFaceAPI(prompt: string): Promise<TriviaQuestion | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    logger.log("🤖 [HF] API key not configured, skipping");
    return null;
  }

  // Use a good open-source model for text generation
  const model = "mistralai/Mistral-7B-Instruct-v0.2"; // Free, good for JSON generation
  
  try {
    logger.log(`🤖 [HF] Trying Hugging Face API with ${model}...`);
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
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
    const trivia = parseTriviaResponse(text);
    return trivia;
  } catch (error) {
    logger.warn("⚠️ [HF] Error:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

export async function generateTriviaFromContent(
  content: string,
  previousQuestions: string[] = [],
  previousAnswerIndices: number[] = []
): Promise<TriviaQuestion | null> {
  try {
    logger.log("🤖 [AI] Starting trivia generation");
    logger.log("📊 [AI] Content length:", content.length);
    logger.log("📊 [AI] Previous questions:", previousQuestions.length);

    const systemPrompt = buildSystemPrompt(previousQuestions, previousAnswerIndices);
    const prompt = `${systemPrompt}\n\nContenido sobre el que crear la trivia:\n\n${content}`;
    logger.log(`🤖 [AI] Prompt length: ${prompt.length} characters`);

    // Try Gemini first (if API key is configured)
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (geminiApiKey) {
      logger.log("🤖 [GEMINI] Trying Gemini API...");
      
      // Try REST API directly (v1, not v1beta) - more reliable
      // Updated model names based on Gemini API changelog (Jan 2026):
      // - gemini-1.5-flash and gemini-1.5-pro were shut down Sep 29, 2025
      // - Latest models: gemini-3-flash-preview, gemini-3-pro-preview
      // - Stable models: gemini-2.5-flash, gemini-2.5-pro
      const restModelNames = [
        "gemini-2.5-flash",        // Stable, fast model
        "gemini-3-flash-preview", // Latest preview
        "gemini-2.5-pro",         // Stable, powerful model
        "gemini-3-pro-preview",   // Latest preview
      ];
      
      for (const modelName of restModelNames) {
        try {
          logger.log(`🤖 [GEMINI] Trying REST API v1 with model: ${modelName}`);
          const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`;
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
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
          
          // Extract text from response
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            logger.warn(`⚠️ [GEMINI] No text in response for ${modelName}`);
            continue;
          }
          
          logger.log("Gemini raw response:", text.substring(0, 500));

          try {
            const trivia = parseTriviaResponse(text);
            return trivia;
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
      
      // Fallback: Try SDK (might work in some cases)
      logger.log("🤖 [GEMINI] REST API failed, trying SDK as fallback...");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const sdkModelNames = [
        "gemini-2.5-flash",
        "gemini-3-flash-preview",
        "gemini-2.5-pro",
        "gemini-3-pro-preview",
      ];
      
      for (const modelName of sdkModelNames) {
        try {
          logger.log(`🤖 [GEMINI] Trying SDK model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          logger.log(`✅ [GEMINI] SDK model ${modelName} worked!`);
          logger.log("Gemini raw response:", text.substring(0, 500));
          
          try {
            const trivia = parseTriviaResponse(text);
            return trivia;
          } catch (parseError) {
            logger.error("JSON parse/validation error:", parseError);
            continue;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          // Check for quota exceeded
          if (errorMsg.includes("quota") || errorMsg.includes("Quota") || errorMsg.includes("429")) {
            logger.warn(`⚠️ [GEMINI] Quota exceeded, trying alternatives...`);
            break;
          }
          logger.warn(`⚠️ [GEMINI] SDK model ${modelName} failed:`, errorMsg);
          continue;
        }
      }
    } else {
      logger.log("🤖 [GEMINI] API key not configured, skipping Gemini");
    }

    // Fallback 1: Try Groq (free, fast)
    logger.log("🤖 [AI] Trying Groq API as fallback...");
    const groqResult = await tryGroqAPI(prompt);
    if (groqResult) {
      return groqResult;
    }

    // Fallback 2: Try Hugging Face (free, rate-limited)
    logger.log("🤖 [AI] Trying Hugging Face API as fallback...");
    const hfResult = await tryHuggingFaceAPI(prompt);
    if (hfResult) {
      return hfResult;
    }
    
    throw new Error("All AI providers failed or quota exceeded. Please check API keys and quotas.");
  } catch (error) {
    logger.error("Error generating trivia:", error);
    if (error instanceof Error) {
      logger.error("Error message:", error.message);
      logger.error("Error stack:", error.stack);
      
      if (error.message.includes("API key")) {
        logger.error("API key issue detected");
      }
      if (error.message.includes("JSON")) {
        logger.error("JSON parsing issue detected");
      }
    }
    return null;
  }
}
