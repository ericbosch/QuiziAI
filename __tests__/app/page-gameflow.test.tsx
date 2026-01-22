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

describe("Home Page - Game Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockFetchWikipediaSummaryClient.mockResolvedValue({
      title: "Test Topic",
      extract: "Test content about the topic",
    });
    mockFetchFallbackData.mockResolvedValue(null);
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
      expect(mockGenerateTriviaFromContentServer).toHaveBeenCalled();
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
      expect(mockGenerateTriviaFromContentServer).toHaveBeenCalledWith(
        "Fallback content",
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
    });
  });

  it("should track asked questions and pass to AI", async () => {
    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    const startButton = screen.getByText("Comenzar");

    fireEvent.change(input, { target: { value: "Test Topic" } });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockGenerateTriviaFromContentServer).toHaveBeenCalledWith(
        expect.any(String),
        [] // First question, no previous questions
      );
    });

    // Generate second question
    mockGenerateTriviaFromContentServer.mockResolvedValue({
      trivia: {
        question: "Second question?",
        options: ["A", "B", "C", "D"] as [string, string, string, string],
        correctAnswerIndex: 1,
        funFact: "Second fact",
      },
      error: null,
    });

    // Simulate next question (would be triggered by GameScreen)
    // For now, just verify the first call
    expect(mockGenerateTriviaFromContentServer).toHaveBeenCalledTimes(1);
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
    });
  });
});
