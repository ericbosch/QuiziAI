/**
 * @jest-environment node
 */

import { buildTriviaPrompt } from "@/lib/server/ai/prompt-builder";
import { GeminiProvider } from "@/lib/server/ai/providers/gemini";
import { GroqProvider } from "@/lib/server/ai/providers/groq";
import { HuggingFaceProvider } from "@/lib/server/ai/providers/huggingface";
import type { TriviaQuestion } from "@/lib/server/ai/types";

const runLive = process.env.RUN_LIVE_AI_TESTS === "true";
const enforceHf = process.env.RUN_HF_LIVE_TESTS === "true";
const hasAnyKey = Boolean(
  process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.HUGGINGFACE_API_KEY
);

const baseContext = {
  previousQuestions: [] as string[],
  previousAnswerIndices: [] as number[],
  questionCount: 1,
  content: "El Sistema Solar tiene ocho planetas. La Tierra es el tercero.",
};

const validateTrivia = (result: TriviaQuestion | TriviaQuestion[] | null) => {
  expect(result).not.toBeNull();
  const trivia = Array.isArray(result) ? result[0] : result;
  expect(trivia).toBeTruthy();
  if (!trivia) return;
  expect(typeof trivia.question).toBe("string");
  expect(trivia.question.length).toBeGreaterThan(0);
  expect(Array.isArray(trivia.options)).toBe(true);
  expect(trivia.options).toHaveLength(4);
  expect(typeof trivia.correctAnswerIndex).toBe("number");
  expect(trivia.correctAnswerIndex).toBeGreaterThanOrEqual(0);
  expect(trivia.correctAnswerIndex).toBeLessThanOrEqual(3);
  expect(typeof trivia.funFact).toBe("string");
};

if (!runLive) {
  describe("Live AI provider smoke tests", () => {
    test.skip("Set RUN_LIVE_AI_TESTS=true to enable live AI tests", () => {});
  });
} else {
  if (!hasAnyKey) {
    throw new Error("RUN_LIVE_AI_TESTS=true but no provider API keys were found.");
  }

  describe("Live AI provider smoke tests", () => {
    jest.setTimeout(60000);

    test("Gemini provider generates a question when configured", async () => {
      const provider = new GeminiProvider();
      if (!provider.isAvailable()) {
        console.warn("Gemini API key not configured; skipping live test.");
        return;
      }
      const prompt = buildTriviaPrompt(baseContext);
      const result = await provider.generate(prompt, 1);
      validateTrivia(result);
    });

    test("Groq provider generates a question when configured", async () => {
      const provider = new GroqProvider();
      if (!provider.isAvailable()) {
        console.warn("Groq API key not configured; skipping live test.");
        return;
      }
      const prompt = buildTriviaPrompt(baseContext);
      const result = await provider.generate(prompt, 1);
      validateTrivia(result);
    });

    test("Hugging Face provider generates a question when configured", async () => {
      const provider = new HuggingFaceProvider();
      if (!provider.isAvailable()) {
        console.warn("Hugging Face API key not configured; skipping live test.");
        return;
      }
      const prompt = buildTriviaPrompt(baseContext);
      const result = await provider.generate(prompt, 1);
      if (!result) {
        if (enforceHf) {
          throw new Error("Hugging Face returned no result while RUN_HF_LIVE_TESTS=true.");
        }
        console.warn("Hugging Face returned no result; skipping live test.");
        return;
      }
      validateTrivia(result);
    });
  });
}
