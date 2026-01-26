import { getMockBatch, MOCK_TRIVIA_BATCH } from "@/lib/shared/mock-provider";
import { TriviaQuestion } from "@/lib/types";

describe("Mock Provider", () => {
  it("should export MOCK_TRIVIA_BATCH with 10 questions", () => {
    expect(MOCK_TRIVIA_BATCH).toBeDefined();
    expect(Array.isArray(MOCK_TRIVIA_BATCH)).toBe(true);
    expect(MOCK_TRIVIA_BATCH.length).toBe(10);
  });

  it("should have valid TriviaQuestion structure for all questions", () => {
    MOCK_TRIVIA_BATCH.forEach((question, index) => {
      expect(question).toHaveProperty("question");
      expect(question).toHaveProperty("options");
      expect(question).toHaveProperty("correctAnswerIndex");
      expect(question).toHaveProperty("funFact");
      
      expect(typeof question.question).toBe("string");
      expect(question.question.length).toBeGreaterThan(0);
      
      expect(Array.isArray(question.options)).toBe(true);
      expect(question.options.length).toBe(4);
      question.options.forEach((option) => {
        expect(typeof option).toBe("string");
        expect(option.length).toBeGreaterThan(0);
      });
      
      expect(typeof question.correctAnswerIndex).toBe("number");
      expect(question.correctAnswerIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctAnswerIndex).toBeLessThanOrEqual(3);
      
      expect(typeof question.funFact).toBe("string");
      expect(question.funFact.length).toBeGreaterThan(0);
    });
  });

  it("should return a copy of the batch via getMockBatch", () => {
    const batch1 = getMockBatch();
    const batch2 = getMockBatch();
    
    expect(batch1).not.toBe(MOCK_TRIVIA_BATCH); // Different reference
    expect(batch1).not.toBe(batch2); // Different references
    expect(batch1).toEqual(MOCK_TRIVIA_BATCH); // Same content
    expect(batch2).toEqual(MOCK_TRIVIA_BATCH); // Same content
  });

  it("should have all questions in Spanish", () => {
    MOCK_TRIVIA_BATCH.forEach((question) => {
      // Check for Spanish characters or common Spanish words
      const hasSpanishChars = /[áéíóúñ¿¡]/.test(question.question);
      const hasSpanishWords = /\b(qué|cuál|quién|dónde|cuándo|por qué|año|es|son|fue|fueron)\b/i.test(question.question);
      
      expect(hasSpanishChars || hasSpanishWords).toBe(true);
    });
  });

  it("should have unique questions", () => {
    const questions = MOCK_TRIVIA_BATCH.map((q) => q.question);
    const uniqueQuestions = new Set(questions);
    expect(uniqueQuestions.size).toBe(questions.length);
  });
});
