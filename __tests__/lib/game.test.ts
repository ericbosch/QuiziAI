import { generateTriviaFromContentServer } from "@/lib/game";
import { generateTriviaFromContent } from "@/lib/ai";

// Mock dependencies
jest.mock("@/lib/ai");

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
    expect(generateTriviaFromContent).toHaveBeenCalledWith("Albert Einstein was a theoretical physicist...", []);
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
    await generateTriviaFromContentServer("Test content", previousQuestions);

    expect(generateTriviaFromContent).toHaveBeenCalledWith("Test content", previousQuestions);
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

    expect(generateTriviaFromContent).toHaveBeenCalledWith("Test content", []);
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
});
