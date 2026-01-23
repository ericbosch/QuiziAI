import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import * as topicsModule from "@/constants/topics";

// Mock the dependencies
jest.mock("@/lib/client/wikipedia-client");
jest.mock("@/lib/client/fallback-data");
jest.mock("@/lib/server/game");

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
