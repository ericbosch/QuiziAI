import { generateTriviaFromContent } from "@/lib/server/ai/index";
import { GeminiProvider } from "@/lib/server/ai/providers/gemini";
import { GroqProvider } from "@/lib/server/ai/providers/groq";
import { HuggingFaceProvider } from "@/lib/server/ai/providers/huggingface";

// Mock providers
jest.mock("@/lib/server/ai/providers/gemini");
jest.mock("@/lib/server/ai/providers/groq");
jest.mock("@/lib/server/ai/providers/huggingface");
jest.mock("@/lib/server/ai/prompt-builder", () => ({
  buildTriviaPrompt: jest.fn(() => ({
    systemPrompt: "System prompt",
    userPrompt: "User prompt",
  })),
}));

// Mock logger
jest.mock("@/lib/server/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe("AI Index (generateTriviaFromContent)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_USE_MOCKS;
  });

  it("should return mock batch when NEXT_PUBLIC_USE_MOCKS is true", async () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "true";

    const result = await generateTriviaFromContent("Test content", [], [], 1);

    expect(result).not.toBeNull();
    if (result && !Array.isArray(result)) {
      expect(result).toHaveProperty("question");
      expect(result).toHaveProperty("options");
    }
  });

  it("should return mock batch array when questionCount > 1", async () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "true";

    const result = await generateTriviaFromContent("Test content", [], [], 5);

    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("should use Gemini provider when available", async () => {
    const mockTrivia = {
      question: "Test?",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Fact",
    };

    const mockGeminiProvider = {
      name: "Gemini",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(mockTrivia),
    };

    (GeminiProvider as jest.Mock).mockImplementation(() => mockGeminiProvider);

    const result = await generateTriviaFromContent("Test content");

    expect(result).toEqual(mockTrivia);
    expect(mockGeminiProvider.generate).toHaveBeenCalled();
  });

  it("should fallback to Groq when Gemini fails", async () => {
    const mockTrivia = {
      question: "Test?",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Fact",
    };

    const mockGeminiProvider = {
      name: "Gemini",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(null),
    };

    const mockGroqProvider = {
      name: "Groq",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(mockTrivia),
    };

    (GeminiProvider as jest.Mock).mockImplementation(() => mockGeminiProvider);
    (GroqProvider as jest.Mock).mockImplementation(() => mockGroqProvider);

    const result = await generateTriviaFromContent("Test content");

    expect(result).toEqual(mockTrivia);
    expect(mockGroqProvider.generate).toHaveBeenCalled();
  });

  it("should handle rate limit errors and continue to next provider", async () => {
    const mockTrivia = {
      question: "Test?",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Fact",
    };

    const mockGeminiProvider = {
      name: "Gemini",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockRejectedValue(new Error("quota exceeded")),
    };

    const mockGroqProvider = {
      name: "Groq",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(mockTrivia),
    };

    (GeminiProvider as jest.Mock).mockImplementation(() => mockGeminiProvider);
    (GroqProvider as jest.Mock).mockImplementation(() => mockGroqProvider);

    const result = await generateTriviaFromContent("Test content");

    expect(result).toEqual(mockTrivia);
    expect(mockGroqProvider.generate).toHaveBeenCalled();
  });

  it("should return null when all providers fail", async () => {
    const mockGeminiProvider = {
      name: "Gemini",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(null),
    };

    const mockGroqProvider = {
      name: "Groq",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(null),
    };

    const mockHFProvider = {
      name: "Hugging Face",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(null),
    };

    (GeminiProvider as jest.Mock).mockImplementation(() => mockGeminiProvider);
    (GroqProvider as jest.Mock).mockImplementation(() => mockGroqProvider);
    (HuggingFaceProvider as jest.Mock).mockImplementation(() => mockHFProvider);

    const result = await generateTriviaFromContent("Test content");

    expect(result).toBeNull();
  });

  it("should skip unavailable providers", async () => {
    const mockTrivia = {
      question: "Test?",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Fact",
    };

    const mockGeminiProvider = {
      name: "Gemini",
      isAvailable: jest.fn().mockReturnValue(false),
      generate: jest.fn(),
    };

    const mockGroqProvider = {
      name: "Groq",
      isAvailable: jest.fn().mockReturnValue(true),
      generate: jest.fn().mockResolvedValue(mockTrivia),
    };

    (GeminiProvider as jest.Mock).mockImplementation(() => mockGeminiProvider);
    (GroqProvider as jest.Mock).mockImplementation(() => mockGroqProvider);

    const result = await generateTriviaFromContent("Test content");

    expect(result).toEqual(mockTrivia);
    expect(mockGeminiProvider.generate).not.toHaveBeenCalled();
    expect(mockGroqProvider.generate).toHaveBeenCalled();
  });
});
