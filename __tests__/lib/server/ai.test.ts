import { generateTriviaFromContent } from "@/lib/server/ai";
import { TriviaQuestion } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock the Google Generative AI library
jest.mock("@google/generative-ai");

// Mock logger
jest.mock("@/lib/server/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch for REST API calls
global.fetch = jest.fn();

describe("AI Service", () => {
  const mockApiKey = "test-api-key";
  let mockModel: any;
  let mockGenAI: any;

  beforeEach(() => {
    // Reset environment
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.HUGGINGFACE_API_KEY;

    // Setup mocks
    mockModel = {
      generateContent: jest.fn(),
    };

    mockGenAI = {
      getGenerativeModel: jest.fn(() => mockModel),
    };

    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => mockGenAI);
    (fetch as jest.Mock).mockClear();
  });

  it("should generate trivia from content successfully via REST API", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    const mockTrivia: TriviaQuestion = {
      question: "¿Cuál es la capital de Francia?",
      options: ["París", "Londres", "Madrid", "Berlín"],
      correctAnswerIndex: 0,
      funFact: "París es conocida como la Ciudad de la Luz.",
    };

    // Mock REST API response
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

  it("should fallback to SDK when REST API fails", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    const mockTrivia: TriviaQuestion = {
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    // REST API fails for all models (4 models to try)
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    // SDK succeeds
    mockModel.generateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockTrivia),
      },
    });

    const result = await generateTriviaFromContent("Test content...");

    expect(result).toEqual(mockTrivia);
    expect(mockGenAI.getGenerativeModel).toHaveBeenCalled();
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
    expect(fetch).toHaveBeenCalled();
  });

  it("should try Hugging Face API when Gemini and Groq fail", async () => {
    // Don't set GEMINI_API_KEY or GROQ_API_KEY so it skips them
    process.env.HUGGINGFACE_API_KEY = "hf-key";

    const mockTrivia: TriviaQuestion = {
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    // Hugging Face succeeds
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        generated_text: JSON.stringify(mockTrivia),
      }],
    });

    const result = await generateTriviaFromContent("Test content...");

    expect(result).toEqual(mockTrivia);
    expect(fetch).toHaveBeenCalled();
  });

  it("should return null when all providers fail", async () => {
    // All APIs fail
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await generateTriviaFromContent("Test content...");

    expect(result).toBeNull();
  });

  it("should handle previous questions in prompt", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    const mockTrivia: TriviaQuestion = {
      question: "New question?",
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
              text: JSON.stringify(mockTrivia),
            }],
          },
        }],
      }),
    });

    const previousQuestions = ["Question 1?", "Question 2?"];
    await generateTriviaFromContent("Content...", previousQuestions);

    const fetchCall = (fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const prompt = body.contents[0].parts[0].text;

    expect(prompt).toContain("Question 1?");
    expect(prompt).toContain("Question 2?");
  });

  it("should parse JSON with markdown code blocks", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    const mockTrivia: TriviaQuestion = {
      question: "Test?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Fact",
    };

    // Mock REST API response with markdown
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

    const result = await generateTriviaFromContent("Content...");

    expect(result).toEqual(mockTrivia);
  });

  it("should handle invalid JSON gracefully", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    // All Gemini models fail with invalid JSON
    (fetch as jest.Mock).mockResolvedValue({
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
    });

    const result = await generateTriviaFromContent("Content...");

    // Should return null after all providers fail
    expect(result).toBeNull();
  });

  it("should clean markdown code blocks from response", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    const mockTrivia: TriviaQuestion = {
      question: "Test question",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    mockModel.generateContent.mockResolvedValueOnce({
      response: {
        text: () => `\`\`\`json\n${JSON.stringify(mockTrivia)}\n\`\`\``,
      },
    });

    const result = await generateTriviaFromContent("Test content");

    expect(result).toEqual(mockTrivia);
  });

  it("should handle missing API key", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const result = await generateTriviaFromContent("Test content");

    expect(result).toBeNull();
  });

  it("should use NEXT_PUBLIC_GEMINI_API_KEY as fallback", async () => {
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = mockApiKey;

    const mockTrivia: TriviaQuestion = {
      question: "Test question",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      funFact: "Test fact",
    };

    mockModel.generateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockTrivia),
      },
    });

    const result = await generateTriviaFromContent("Test content");

    expect(result).toEqual(mockTrivia);
    expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey);
  });

  it("should handle invalid JSON response", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    mockModel.generateContent.mockResolvedValueOnce({
      response: {
        text: () => "Invalid JSON {",
      },
    });

    const result = await generateTriviaFromContent("Test content");

    expect(result).toBeNull();
  });

  it("should handle invalid trivia structure", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    const invalidTrivia = {
      question: "Test",
      options: ["A", "B"], // Only 2 options instead of 4
      correctAnswerIndex: 0,
      funFact: "Test",
    };

    mockModel.generateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(invalidTrivia),
      },
    });

    const result = await generateTriviaFromContent("Test content");

    expect(result).toBeNull();
  });

  it("should handle out-of-range correctAnswerIndex", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    const invalidTrivia = {
      question: "Test",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 5, // Out of range
      funFact: "Test",
    };

    mockModel.generateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(invalidTrivia),
      },
    });

    const result = await generateTriviaFromContent("Test content");

    expect(result).toBeNull();
  });

  it("should handle API errors gracefully", async () => {
    process.env.GEMINI_API_KEY = mockApiKey;

    mockModel.generateContent.mockRejectedValueOnce(
      new Error("API Error")
    );

    const result = await generateTriviaFromContent("Test content");

    expect(result).toBeNull();
  });
});
