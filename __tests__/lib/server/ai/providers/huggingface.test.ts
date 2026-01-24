import { HuggingFaceProvider } from "@/lib/server/ai/providers/huggingface";
import { TriviaQuestion } from "@/lib/server/ai/types";
import { PromptResult } from "@/lib/server/ai/prompt-builder";

// Mock logger
jest.mock("@/lib/server/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe("HuggingFaceProvider", () => {
  let provider: HuggingFaceProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.HUGGINGFACE_API_KEY;
    provider = new HuggingFaceProvider();
  });

  it("should not be available when API key is missing", () => {
    expect(provider.isAvailable()).toBe(false);
  });

  it("should be available when API key is set", () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();
    expect(provider.isAvailable()).toBe(true);
  });

  it("should generate trivia successfully", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();

    const mockTrivia: TriviaQuestion = {
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    const prompt: PromptResult = {
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        generated_text: JSON.stringify(mockTrivia),
      }],
    });

    const result = await provider.generate(prompt, 1);

    expect(result).toEqual(mockTrivia);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("router.huggingface.co/hf-inference/models"),
      expect.any(Object)
    );
  });

  it("should handle API errors", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();

    const prompt: PromptResult = {
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    const result = await provider.generate(prompt, 1);

    expect(result).toBeNull();
  });

  it("should handle missing generated text", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();

    const prompt: PromptResult = {
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{}],
    });

    const result = await provider.generate(prompt, 1);

    expect(result).toBeNull();
  });

  it("should handle string response format", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();

    const mockTrivia: TriviaQuestion = {
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    const prompt: PromptResult = {
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => JSON.stringify(mockTrivia),
    });

    const result = await provider.generate(prompt, 1);

    expect(result).toEqual(mockTrivia);
  });

  it("should handle object with generated_text property", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();

    const mockTrivia: TriviaQuestion = {
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    const prompt: PromptResult = {
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_text: JSON.stringify(mockTrivia),
      }),
    });

    const result = await provider.generate(prompt, 1);

    expect(result).toEqual(mockTrivia);
  });

  it("should handle batch generation", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();

    const mockBatch = {
      questions: [
        {
          question: "Question 1?",
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 0,
          funFact: "Fact 1",
        },
      ],
    };

    const prompt: PromptResult = {
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        generated_text: JSON.stringify(mockBatch),
      }],
    });

    const result = await provider.generate(prompt, 2);

    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle network errors", async () => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    provider = new HuggingFaceProvider();

    const prompt: PromptResult = {
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
    };

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await provider.generate(prompt, 1);

    expect(result).toBeNull();
  });
});
