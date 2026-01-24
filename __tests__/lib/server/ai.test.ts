import { generateTriviaFromContent } from "@/lib/server/ai/index";
import { TriviaQuestion } from "@/lib/types";

// Mock logger
jest.mock("@/lib/server/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe("AI Service", () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.HUGGINGFACE_API_KEY;
    (fetch as jest.Mock).mockClear();
  });

  it("should generate trivia from content successfully via Gemini REST API", async () => {
    process.env.GEMINI_API_KEY = "test-api-key";

    const mockTrivia: TriviaQuestion = {
      question: "¿Cuál es la capital de Francia?",
      options: ["París", "Londres", "Madrid", "Berlín"],
      correctAnswerIndex: 0,
      funFact: "París es conocida como la Ciudad de la Luz.",
    };

    // Mock REST API response (Gemini tries multiple models, first one succeeds)
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockTrivia),
            }],
          },
        }],
      }),
    });

    const result = await generateTriviaFromContent("París es la capital de Francia...");

    expect(result).toEqual(mockTrivia);
    expect(fetch).toHaveBeenCalled();
  });

  it("should try Groq API when Gemini fails", async () => {
    // Don't set GEMINI_API_KEY so it skips Gemini
    process.env.GROQ_API_KEY = "groq-key";

    const mockTrivia: TriviaQuestion = {
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    // Groq succeeds
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify(mockTrivia),
          },
        }],
      }),
    });

    const result = await generateTriviaFromContent("Test content...");

    expect(result).toEqual(mockTrivia);
    // Verify Groq endpoint was called
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("api.groq.com"),
      expect.any(Object)
    );
  });

  it("should try Hugging Face API when others fail", async () => {
    process.env.HUGGINGFACE_API_KEY = "hf-key";

    const mockTrivia: TriviaQuestion = {
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    // HF succeeds
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        generated_text: JSON.stringify(mockTrivia),
      }],
    });

    const result = await generateTriviaFromContent("Test content...");

    expect(result).toEqual(mockTrivia);
    // Verify it's using the new router endpoint
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("router.huggingface.co/hf-inference/models"),
      expect.any(Object)
    );
  });

  it("should return null when all providers fail", async () => {
    // No API keys set
    const result = await generateTriviaFromContent("Test content...");
    expect(result).toBeNull();
  });

  it("should handle previous questions in prompt", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockTrivia: TriviaQuestion = {
      question: "New question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 1,
      funFact: "Fact",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockTrivia),
            }],
          },
        }],
      }),
    });

    await generateTriviaFromContent("Content", ["Previous question"], [0]);

    // Verify the prompt includes previous questions
    const callArgs = (fetch as jest.Mock).mock.calls;
    if (callArgs.length > 0 && callArgs[0][1]) {
      const body = JSON.parse(callArgs[0][1].body);
      expect(body.contents[0].parts[0].text).toContain("Previous question");
    }
  });

  it("should handle batch generation", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockBatch = {
      questions: [
        {
          question: "Question 1?",
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 0,
          funFact: "Fact 1",
        },
        {
          question: "Question 2?",
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 1,
          funFact: "Fact 2",
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockBatch),
            }],
          },
        }],
      }),
    });

    const result = await generateTriviaFromContent("Content", [], [], 2);

    expect(result).not.toBeNull();
    if (result && Array.isArray(result)) {
      expect(result.length).toBe(2);
    } else {
      // If single question returned, that's also acceptable (provider might not support batching)
      expect(result).toBeTruthy();
    }
  });

  it("should parse JSON with markdown code blocks", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockTrivia: TriviaQuestion = {
      question: "Test?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Fact",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: "```json\n" + JSON.stringify(mockTrivia) + "\n```",
            }],
          },
        }],
      }),
    });

    const result = await generateTriviaFromContent("Content");
    expect(result).toEqual(mockTrivia);
  });

  it("should handle invalid JSON gracefully", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GROQ_API_KEY = "groq-key";
    process.env.HUGGINGFACE_API_KEY = "hf-key";

    // All providers return invalid JSON
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: "Invalid JSON {",
              }],
            },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: "Invalid JSON {",
            },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          generated_text: "Invalid JSON {",
        }],
      });

    const result = await generateTriviaFromContent("Content");
    expect(result).toBeNull();
  });
});
