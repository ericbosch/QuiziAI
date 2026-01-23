import { generateTriviaFromContentServer, generateTriviaBatch } from "@/lib/server/game";
import { generateTriviaFromContent } from "@/lib/server/ai/index";

// Mock dependencies
jest.mock("@/lib/server/ai");
jest.mock("@/lib/server/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe("Game Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate trivia from content successfully", async () => {
    const mockTrivia = {
      question: "¿Quién desarrolló la teoría de la relatividad?",
      options: ["Einstein", "Newton", "Galileo", "Tesla"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Einstein ganó el Nobel en 1921.",
    };

    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(mockTrivia);

    const result = await generateTriviaFromContentServer("Albert Einstein was a theoretical physicist...");

    expect(result).toEqual({ trivia: mockTrivia, error: null });
    expect(generateTriviaFromContent).toHaveBeenCalledWith("Albert Einstein was a theoretical physicist...", [], [], 1);
  });

  it("should return error for empty content", async () => {
    const result = await generateTriviaFromContentServer("   ");

    expect(result).toEqual({
      trivia: null,
      error: "No se proporcionó contenido para generar la trivia.",
    });
    expect(generateTriviaFromContent).not.toHaveBeenCalled();
  });

  it("should return error when AI generation fails", async () => {
    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(null);

    const result = await generateTriviaFromContentServer("Test content");

    expect(result).toEqual({
      trivia: null,
      error: "Error al generar la trivia. Intenta de nuevo.",
    });
  });

  it("should pass previous questions to AI", async () => {
    const mockTrivia = {
      question: "Test question",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(mockTrivia);

    const previousQuestions = ["Question 1", "Question 2"];
    const previousAnswerIndices = [0, 1];
    await generateTriviaFromContentServer("Test content", previousQuestions, previousAnswerIndices);

    expect(generateTriviaFromContent).toHaveBeenCalledWith("Test content", previousQuestions, previousAnswerIndices, 1);
  });

  it("should trim content before processing", async () => {
    const mockTrivia = {
      question: "Test",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Test",
    };

    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(mockTrivia);

    await generateTriviaFromContentServer("  Test content  ");

    expect(generateTriviaFromContent).toHaveBeenCalledWith("Test content", [], [], 1);
  });

  it("should handle errors gracefully", async () => {
    (generateTriviaFromContent as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    const result = await generateTriviaFromContentServer("Test content");

    expect(result).toEqual({
      trivia: null,
      error: "Error al generar la trivia. Intenta de nuevo.",
    });
  });

  it("should return API key error when API key is missing", async () => {
    (generateTriviaFromContent as jest.Mock).mockRejectedValueOnce(
      new Error("Gemini API key not configured")
    );

    const result = await generateTriviaFromContentServer("Test content");

    expect(result).toEqual({
      trivia: null,
      error: "Error de configuración: API key de Gemini no válida. Verifica tu .env.local",
    });
  });

  it("should return rate limit error when quota is exceeded", async () => {
    (generateTriviaFromContent as jest.Mock).mockRejectedValueOnce(
      new Error("quota exceeded")
    );

    const result = await generateTriviaFromContentServer("Test content");

    expect(result).toEqual({
      trivia: null,
      error: "RATE_LIMIT",
    });
  });

  it("should return JSON parse error when response is invalid", async () => {
    (generateTriviaFromContent as jest.Mock).mockRejectedValueOnce(
      new Error("JSON parse error")
    );

    const result = await generateTriviaFromContentServer("Test content");

    expect(result).toEqual({
      trivia: null,
      error: "Error al procesar la respuesta de la IA. Intenta con otro tema.",
    });
  });
});

describe("generateTriviaBatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate batch of questions successfully", async () => {
    const mockBatch = [
      {
        question: "Question 1?",
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 0,
        funFact: "Fact 1",
      },
      {
        question: "Question 2?",
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 1,
        funFact: "Fact 2",
      },
    ];

    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(mockBatch);

    const result = await generateTriviaBatch("Test content", 2);

    expect(result.questions).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(generateTriviaFromContent).toHaveBeenCalledWith("Test content", [], [], 2);
  });

  it("should filter duplicates from batch", async () => {
    const mockBatch = [
      {
        question: "Question 1?",
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 0,
        funFact: "Fact 1",
      },
      {
        question: "Question 1?", // Duplicate
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 0,
        funFact: "Fact 1",
      },
    ];

    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(mockBatch);

    const result = await generateTriviaBatch("Test content", 2, ["Question 1?"]);

    expect(result.questions).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle single question response as fallback", async () => {
    const mockSingle = {
      question: "Question 1?",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Fact 1",
    };

    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(mockSingle);

    const result = await generateTriviaBatch("Test content", 2);

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toEqual(mockSingle);
  });

  it("should handle batch generation errors", async () => {
    (generateTriviaFromContent as jest.Mock).mockRejectedValueOnce(new Error("Batch failed"));

    const result = await generateTriviaBatch("Test content", 2);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle null batch result", async () => {
    (generateTriviaFromContent as jest.Mock).mockResolvedValueOnce(null);

    const result = await generateTriviaBatch("Test content", 2);

    expect(result.questions).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
