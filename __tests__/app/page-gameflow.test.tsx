import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import * as topicsModule from "@/constants/topics";

// Mock the dependencies
jest.mock("@/lib/client/wikipedia-client");
jest.mock("@/lib/client/fallback-data");
jest.mock("@/lib/server/game");

jest.mock("@/constants/topics", () => {
  const actual = jest.requireActual("@/constants/topics");
  return {
    ...actual,
    getRandomTopicFromCategory: jest.fn(actual.getRandomTopicFromCategory),
    getRandomTopicFromAnyCategory: jest.fn(actual.getRandomTopicFromAnyCategory),
  };
});

const mockFetchWikipediaSummaryClient = require("@/lib/client/wikipedia-client").fetchWikipediaSummaryClient;
const mockFetchFallbackData = require("@/lib/client/fallback-data").fetchFallbackData;
const mockGenerateTriviaFromContentServer = require("@/lib/server/game").generateTriviaFromContentServer;
const mockGenerateTriviaBatch = require("@/lib/server/game").generateTriviaBatch;

describe("Home Page - Game Flow", () => {
  // Helper to wait for trivia to appear
  const waitForTrivia = async () => {
    await waitFor(() => {
      expect(screen.queryByText(/tiempo restante|siguiente pregunta/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  };
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockFetchWikipediaSummaryClient.mockResolvedValue({
      title: "Test Topic",
      extract: "Test content about the topic",
    });
    mockFetchFallbackData.mockResolvedValue(null);
    // Mock batch generation (used when queue is empty) - returns 10 questions
    const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
      question: `Test question ${i + 1}?`,
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: i % 4,
      funFact: `Test fact ${i + 1}`,
    }));
    mockGenerateTriviaBatch.mockResolvedValue({
      questions: mockQuestions,
      errors: [],
    });
    // Mock single question generation (fallback)
    mockGenerateTriviaFromContentServer.mockResolvedValue({
      trivia: {
        question: "Test question?",
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 0,
        funFact: "Test fact",
      },
      error: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should start game with manual topic input", async () => {
    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Albert Einstein" } });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledWith("Albert Einstein");
      // With batch generation, it should call generateTriviaBatch when cache is empty
      expect(mockGenerateTriviaBatch).toHaveBeenCalled();
    });
  });

  it("should handle Wikipedia fetch failure and use fallback", async () => {
    mockFetchWikipediaSummaryClient.mockResolvedValue(null);
    mockFetchFallbackData.mockResolvedValue({
      title: "Fallback Topic",
      extract: "Fallback content",
    });

    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockFetchFallbackData).toHaveBeenCalledWith("Test Topic");
      // With batch generation, it should call generateTriviaBatch when queue is empty
      expect(mockGenerateTriviaBatch).toHaveBeenCalledWith(
        expect.any(String),
        10, // BATCH_SIZE
        expect.any(Array),
        expect.any(Array)
      );
    });
  });

  it("should handle error when no data found", async () => {
    mockFetchWikipediaSummaryClient.mockResolvedValue(null);
    mockFetchFallbackData.mockResolvedValue(null);

    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Nonexistent" } });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/No se encontró información/)).toBeInTheDocument();
    });
  });

  it("should handle AI generation error", async () => {
    // Mock batch generation to fail
    mockGenerateTriviaBatch.mockResolvedValue({
      questions: [],
      errors: ["AI generation failed"],
    });
    // Mock single question fallback to also fail
    mockGenerateTriviaFromContentServer.mockResolvedValue({
      trivia: null,
      error: "AI generation failed",
    });

    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText("AI generation failed")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("should track asked questions and pass to AI", async () => {
    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(startButton);

    await waitFor(() => {
      // With batch generation, it should call generateTriviaBatch when queue is empty
      expect(mockGenerateTriviaBatch).toHaveBeenCalledWith(
        expect.any(String),
        10, // BATCH_SIZE
        expect.any(Array),
        expect.any(Array)
      );
    });

    // Generate second question - should use queue if available, otherwise fetch new batch
    // The queue should have remaining questions from the first batch
  });

  it("should disable start button when input is empty", () => {
    render(<Home />);
    
    const startButton = screen.getByText("Comenzar");
    expect(startButton).toBeDisabled();
  });

  it("should enable start button when input has value", () => {
    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Test" } });
    expect(startButton).not.toBeDisabled();
  });

  it("should show loading state during game start", async () => {
    mockFetchWikipediaSummaryClient.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(startButton).toBeDisabled();
      expect(screen.getByText("Generando trivia...")).toBeInTheDocument();
    });
  });

  it("should handle Enter key to start game", async () => {
    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledWith("Test Topic");
      // Batch generation should be called
      expect(mockGenerateTriviaBatch).toHaveBeenCalled();
    });
  });

  it("should ignore Enter when topic is blank", () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockFetchWikipediaSummaryClient).not.toHaveBeenCalled();
    expect(screen.queryByText("Generando trivia...")).not.toBeInTheDocument();
  });

  it("should show error when Wikipedia fetch throws", async () => {
    mockFetchWikipediaSummaryClient.mockRejectedValueOnce(new Error("Boom"));

    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar la trivia/i)).toBeInTheDocument();
    });
  });

  it("should show error when single fallback returns no trivia and no error", async () => {
    mockGenerateTriviaBatch.mockResolvedValueOnce({
      questions: [],
      errors: [],
    });
    mockGenerateTriviaFromContentServer.mockResolvedValueOnce({
      trivia: null,
      error: null,
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(
        screen.getByText("No se pudo generar la trivia. Intenta de nuevo.")
      ).toBeInTheDocument();
    });
  });

  it("should skip duplicate questions in queue and use next", async () => {
    const duplicateQuestion = {
      question: "Duplicate question?",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: "Duplicate fact",
    };
    const nextQuestion = {
      question: "Fresh question?",
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 1,
      funFact: "Fresh fact",
    };

    mockGenerateTriviaBatch.mockReset();
    mockGenerateTriviaBatch
      .mockResolvedValueOnce({
        questions: [duplicateQuestion, duplicateQuestion, nextQuestion],
        errors: [],
      })
      .mockResolvedValue({ questions: [], errors: [] });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(screen.getByText("Duplicate question?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Siguiente pregunta"));

    await waitFor(() => {
      expect(screen.getByText("Fresh question?")).toBeInTheDocument();
    });
  });

  it("should fetch new topic when queue empty and category selected", async () => {
    const topicA = "Topic A";
    const topicB = "Topic B";

    (topicsModule.getRandomTopicFromCategory as jest.Mock)
      .mockReturnValueOnce(topicA)
      .mockReturnValueOnce(topicB);

    mockGenerateTriviaBatch.mockReset();
    mockGenerateTriviaBatch
      .mockResolvedValueOnce({
        questions: [
          {
            question: "Category question 1?",
            options: ["A", "B", "C", "D"] as [string, string, string, string],
            correctAnswerIndex: 0,
            funFact: "Cat fact 1",
          },
        ],
        errors: [],
      })
      .mockResolvedValueOnce({ questions: [], errors: [] })
      .mockResolvedValueOnce({
        questions: [
          {
            question: "Category question 2?",
            options: ["A", "B", "C", "D"] as [string, string, string, string],
            correctAnswerIndex: 1,
            funFact: "Cat fact 2",
          },
        ],
        errors: [],
      })
      .mockResolvedValue({ questions: [], errors: [] });

    render(<Home />);

    fireEvent.click(screen.getByText("🏛️ Historia"));

    await waitFor(() => {
      expect(screen.getByText("Category question 1?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Siguiente pregunta"));

    await waitFor(() => {
      expect(screen.getByText("Category question 2?")).toBeInTheDocument();
    });

    expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledWith(topicA);
    expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledWith(topicB);
  });

  it("should prefetch when queue is low and surface RATE_LIMIT", async () => {
    mockGenerateTriviaBatch.mockReset();
    mockGenerateTriviaBatch
      .mockResolvedValueOnce({
        questions: [
          {
            question: "Prefetch question 1?",
            options: ["A", "B", "C", "D"] as [string, string, string, string],
            correctAnswerIndex: 0,
            funFact: "Prefetch fact 1",
          },
          {
            question: "Prefetch question 2?",
            options: ["A", "B", "C", "D"] as [string, string, string, string],
            correctAnswerIndex: 1,
            funFact: "Prefetch fact 2",
          },
        ],
        errors: [],
      })
      .mockResolvedValueOnce({
        questions: [
          {
            question: "Prefetch question 3?",
            options: ["A", "B", "C", "D"] as [string, string, string, string],
            correctAnswerIndex: 2,
            funFact: "Prefetch fact 3",
          },
        ],
        errors: ["RATE_LIMIT"],
      })
      .mockResolvedValue({ questions: [], errors: [] });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(screen.getByText("Prefetch question 1?")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText("Servicio temporalmente no disponible")
      ).toBeInTheDocument();
    });

    expect(mockGenerateTriviaBatch).toHaveBeenCalledTimes(2);
  });

  it("should retry using queued questions without regenerating batch", async () => {
    const batchQuestions = Array.from({ length: 5 }, (_, i) => ({
      question: `Retry question ${i + 1}?`,
      options: ["A", "B", "C", "D"] as [string, string, string, string],
      correctAnswerIndex: 0,
      funFact: `Retry fact ${i + 1}`,
    }));

    mockGenerateTriviaBatch.mockReset();
    mockGenerateTriviaBatch
      .mockResolvedValueOnce({
        questions: batchQuestions,
        errors: ["RATE_LIMIT"],
      })
      .mockResolvedValue({ questions: [], errors: [] });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(screen.getByText("Retry question 1?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Reintentar"));

    await waitFor(() => {
      expect(screen.getByText("Retry question 2?")).toBeInTheDocument();
    });

    expect(mockGenerateTriviaBatch).toHaveBeenCalled();
    expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledTimes(2);
  });

  it("should use queued question on next question without refetching", async () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(screen.getByText("Test question 1?")).toBeInTheDocument();
    });

    // Answer to reveal "Siguiente pregunta"
    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Siguiente pregunta"));

    await waitFor(() => {
      expect(screen.getByText("Test question 2?")).toBeInTheDocument();
    });

    expect(mockGenerateTriviaBatch).toHaveBeenCalled();
    expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledTimes(1);
  });

  it("should regenerate batch from same content when queue is empty and no category", async () => {
    const firstBatch = [
      {
        question: "Solo question 1?",
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 0,
        funFact: "Solo fact 1",
      },
    ];
    const secondBatch = [
      {
        question: "Solo question 2?",
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 1,
        funFact: "Solo fact 2",
      },
    ];

    mockGenerateTriviaBatch.mockReset();
    mockGenerateTriviaBatch
      .mockResolvedValueOnce({ questions: firstBatch, errors: [] })
      .mockResolvedValueOnce({ questions: [], errors: [] })
      .mockResolvedValueOnce({ questions: secondBatch, errors: [] });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(screen.getByText("Solo question 1?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Siguiente pregunta"));

    await waitFor(() => {
      expect(screen.getByText("Solo question 2?")).toBeInTheDocument();
    });

    expect(mockGenerateTriviaBatch).toHaveBeenCalledTimes(3);
    expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledTimes(1);
  });

  it("should show rate limit notification when batch includes RATE_LIMIT", async () => {
    mockGenerateTriviaBatch.mockResolvedValueOnce({
      questions: [
        {
          question: "Rate limit question?",
          options: ["A", "B", "C", "D"] as [string, string, string, string],
          correctAnswerIndex: 0,
          funFact: "Rate limit fact",
        },
      ],
      errors: ["RATE_LIMIT"],
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    await waitFor(() => {
      expect(
        screen.getByText("Servicio temporalmente no disponible")
      ).toBeInTheDocument();
    });
  });

  it("should reset game state when Nuevo tema is clicked", async () => {
    render(<Home />);
    
    // Start a game first
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    // Wait for game to start (trivia question appears)
    await waitFor(() => {
      const question = screen.queryByText(/Test question/i);
      expect(question).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click "Nuevo tema" button
    const newTopicButton = screen.getByText("Nuevo tema");
    fireEvent.click(newTopicButton);

    // Should return to category selection screen
    await waitFor(() => {
      expect(screen.getByText("Juego Rápido")).toBeInTheDocument();
    }, { timeout: 2000 });
  }, 10000);


  it("should show dynamic loading messages", async () => {
    // Delay the response to see loading messages
    mockFetchWikipediaSummaryClient.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        title: "Test Topic",
        extract: "Test content",
      }), 100))
    );

    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(screen.getByText("Comenzar"));

    // Check for loading message (may rotate quickly)
    await waitFor(() => {
      const loadingMessages = [
        /Consultando la Biblioteca/i,
        /Interrogando a la IA/i,
        /Limpiando el polvo/i,
        /Sincronizando neuronas/i,
        /Cargando categoría/i,
      ];
      const hasLoadingMessage = loadingMessages.some(msg => 
        screen.queryByText(msg) !== null
      );
      expect(hasLoadingMessage || screen.queryByText(/tiempo restante/i)).toBeTruthy();
    }, { timeout: 2000 });
  });
});
