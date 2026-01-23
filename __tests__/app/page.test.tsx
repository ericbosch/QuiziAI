import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import * as topicsModule from "@/constants/topics";

// Mock the dependencies
jest.mock("@/lib/client/wikipedia-client");
jest.mock("@/lib/client/fallback-data");
jest.mock("@/lib/server/game");

// Mock topics module - use actual implementation but allow spying
jest.mock("@/constants/topics", () => {
  const actual = jest.requireActual("@/constants/topics");
  return {
    ...actual,
    getRandomTopicFromCategory: jest.fn(actual.getRandomTopicFromCategory),
    getRandomTopicFromAnyCategory: jest.fn(actual.getRandomTopicFromAnyCategory),
  };
});

// Mock the modules
const mockFetchWikipediaSummaryClient = require("@/lib/client/wikipedia-client").fetchWikipediaSummaryClient;
const mockFetchFallbackData = require("@/lib/client/fallback-data").fetchFallbackData;
const mockGenerateTriviaFromContentServer = require("@/lib/server/game").generateTriviaFromContentServer;
const mockGenerateTriviaBatch = require("@/lib/server/game").generateTriviaBatch;

describe("Home Page - Category Selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
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

  it("should render Quick Play section with categories", () => {
    render(<Home />);
    
    expect(screen.getByText("Juego Rápido")).toBeInTheDocument();
    expect(screen.getByText("🎲 Aleatorio")).toBeInTheDocument();
    expect(screen.getByText("🏛️ Historia")).toBeInTheDocument();
    expect(screen.getByText("🔬 Ciencia")).toBeInTheDocument();
  });

  it("should render all category buttons", () => {
    render(<Home />);
    
    const categories = ["Historia", "Ciencia", "Cine", "Geografía", "Deportes", "Literatura", "Arte", "Música"];
    categories.forEach((categoryName) => {
      expect(screen.getByText(new RegExp(categoryName))).toBeInTheDocument();
    });
  });

  it("should call handleStartGame with random topic when category is clicked", async () => {
    const mockTopic = "Albert Einstein";
    (topicsModule.getRandomTopicFromCategory as jest.Mock).mockReturnValue(mockTopic);

    render(<Home />);
    
    const historyButton = screen.getByText("🏛️ Historia");
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(topicsModule.getRandomTopicFromCategory).toHaveBeenCalledWith("history");
      expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledWith(mockTopic);
    });
  });

  it("should call handleStartGame with random topic when Aleatorio is clicked", async () => {
    const mockTopic = "Random Topic";
    const mockCategory = { id: "science" as const, name: "Ciencia", emoji: "🔬", topics: [] };
    
    // Reset and set mocks before rendering
    (topicsModule.getRandomTopicFromAnyCategory as jest.Mock).mockReset();
    (topicsModule.getRandomTopicFromCategory as jest.Mock).mockReset();
    
    (topicsModule.getRandomTopicFromAnyCategory as jest.Mock).mockReturnValue({
      topic: "Initial Topic", // This topic is not used, only category matters
      category: mockCategory,
    });
    
    // This is the topic that will actually be used by handleStartGame
    (topicsModule.getRandomTopicFromCategory as jest.Mock).mockReturnValue(mockTopic);

    render(<Home />);
    
    const surpriseButton = screen.getByText("🎲 Aleatorio");
    fireEvent.click(surpriseButton);

    await waitFor(() => {
      expect(topicsModule.getRandomTopicFromAnyCategory).toHaveBeenCalled();
      expect(topicsModule.getRandomTopicFromCategory).toHaveBeenCalledWith("science");
      expect(mockFetchWikipediaSummaryClient).toHaveBeenCalledWith(mockTopic);
    }, { timeout: 3000 });
  });

  it("should clear topic input when category is selected", async () => {
    const mockTopic = "Test Topic";
    (topicsModule.getRandomTopicFromCategory as jest.Mock).mockReturnValue(mockTopic);
    
    render(<Home />);
    
    // First set a manual topic
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Manual Topic" } });
    expect(input.value).toBe("Manual Topic");
    
    // Then select a category - should clear input
    const scienceButton = screen.getByText("🔬 Ciencia");
    fireEvent.click(scienceButton);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("should disable category buttons when loading", async () => {
    mockFetchWikipediaSummaryClient.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Home />);
    
    const surpriseButton = screen.getByText("🎲 Aleatorio");
    fireEvent.click(surpriseButton);

    await waitFor(() => {
      expect(surpriseButton).toBeDisabled();
    });
  });

  it("should show divider between Quick Play and manual input", () => {
    render(<Home />);
    
    // Check for the "o" divider text
    expect(screen.getByText("o")).toBeInTheDocument();
  });

  it("should maintain manual input functionality", () => {
    render(<Home />);
    
    const input = screen.getByPlaceholderText(/Ej: Albert Einstein/) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    
    fireEvent.change(input, { target: { value: "Manual Topic" } });
    expect(input.value).toBe("Manual Topic");
  });
});
