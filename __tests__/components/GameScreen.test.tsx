import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GameScreen from "@/components/GameScreen";
import { TriviaQuestion } from "@/lib/ai";

const mockTrivia: TriviaQuestion = {
  question: "¿Cuál es la capital de Francia?",
  options: ["París", "Londres", "Madrid", "Berlín"],
  correctAnswerIndex: 0,
  funFact: "París es conocida como la Ciudad de la Luz.",
};

describe("GameScreen Component", () => {
  const mockOnAnswer = jest.fn();
  const mockOnNextQuestion = jest.fn();
  const mockOnNewTopic = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should render question and options", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    expect(screen.getByText(mockTrivia.question)).toBeInTheDocument();
    mockTrivia.options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it("should show feedback when correct option is clicked", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const correctButton = screen.getByText("París");
    fireEvent.click(correctButton);

    expect(screen.getByText("¡Correcto! ✓")).toBeInTheDocument();
    expect(screen.getByText(mockTrivia.funFact)).toBeInTheDocument();
    expect(screen.getByText("Siguiente pregunta")).toBeInTheDocument();
  });

  it("should show feedback when incorrect option is clicked", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const incorrectButton = screen.getByText("Londres");
    fireEvent.click(incorrectButton);

    expect(screen.getByText("Incorrecto ✗")).toBeInTheDocument();
    expect(screen.getByText(mockTrivia.funFact)).toBeInTheDocument();
    expect(screen.getByText("Siguiente pregunta")).toBeInTheDocument();
  });

  it("should show timer countdown after answer", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const correctButton = screen.getByText("París");
    fireEvent.click(correctButton);

    expect(screen.getByText(/Siguiente pregunta en \d+s/)).toBeInTheDocument();
  });

  it("should call onNextQuestion when next button is clicked", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const correctButton = screen.getByText("París");
    fireEvent.click(correctButton);

    const nextButton = screen.getByText("Siguiente pregunta");
    fireEvent.click(nextButton);

    expect(mockOnAnswer).toHaveBeenCalledWith(true);
    expect(mockOnNextQuestion).toHaveBeenCalledTimes(1);
  });

  it("should auto-advance after 10 seconds", async () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const correctButton = screen.getByText("París");
    fireEvent.click(correctButton);

    // Verify feedback is shown
    expect(screen.getByText("¡Correcto! ✓")).toBeInTheDocument();

    // Advance timer by 10 seconds (timer starts after feedback is shown)
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockOnAnswer).toHaveBeenCalledWith(true);
    });

    await waitFor(() => {
      expect(mockOnNextQuestion).toHaveBeenCalledTimes(1);
    });
  });

  it("should highlight correct answer in green after selection", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const correctButton = screen.getByText("París").closest("button");
    if (correctButton) {
      fireEvent.click(correctButton);
      expect(correctButton).toHaveClass("bg-green-600");
    }
  });

  it("should highlight incorrect answer in red after selection", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const incorrectButton = screen.getByText("Londres").closest("button");
    if (incorrectButton) {
      fireEvent.click(incorrectButton);
      expect(incorrectButton).toHaveClass("bg-red-600");
    }
  });

  it("should disable buttons after selection", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const button = screen.getByText("París").closest("button");
    if (button) {
      fireEvent.click(button);
    }

    // All buttons should be disabled
    mockTrivia.options.forEach((option) => {
      const optionText = screen.getByText(option);
      const btn = optionText.closest("button");
      expect(btn).toBeDisabled();
    });
  });

  it("should not allow multiple selections", () => {
    jest.useFakeTimers();
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const button1 = screen.getByText("París").closest("button");
    const button2 = screen.getByText("Londres").closest("button");

    if (button1) {
      fireEvent.click(button1);
      // Wait for state update
      jest.advanceTimersByTime(100);
    }
    
    // onAnswer is NOT called immediately - it's called in handleNextQuestion
    // But we can verify button is disabled
    if (button2) {
      expect(button2).toBeDisabled();
      fireEvent.click(button2);
    }

    // Verify button1 triggered the selection (feedback should show)
    expect(screen.getByText("¡Correcto! ✓")).toBeInTheDocument();
    
    jest.useRealTimers();
  });

  it("should display score when provided", () => {
    const score = { correct: 5, total: 10 };
    render(
      <GameScreen
        trivia={mockTrivia}
        onAnswer={mockOnAnswer}
        onNextQuestion={mockOnNextQuestion}
        score={score}
      />
    );

    expect(screen.getByText("5/10")).toBeInTheDocument();
  });

  it("should display progress bar when score is provided", () => {
    const score = { correct: 3, total: 5 };
    const { container } = render(
      <GameScreen
        trivia={mockTrivia}
        onAnswer={mockOnAnswer}
        onNextQuestion={mockOnNextQuestion}
        score={score}
      />
    );

    // Progress bar is a div with bg-blue-600 class
    const progressBar = container.querySelector(".bg-blue-600");
    expect(progressBar).toBeInTheDocument();
  });

  it("should call onNewTopic when new topic button is clicked", () => {
    render(
      <GameScreen
        trivia={mockTrivia}
        onAnswer={mockOnAnswer}
        onNextQuestion={mockOnNextQuestion}
        onNewTopic={mockOnNewTopic}
      />
    );

    const newTopicButton = screen.getByText("Nuevo tema");
    fireEvent.click(newTopicButton);

    expect(mockOnNewTopic).toHaveBeenCalledTimes(1);
  });

  it("should display current topic in footer when provided", () => {
    render(
      <GameScreen
        trivia={mockTrivia}
        onAnswer={mockOnAnswer}
        onNextQuestion={mockOnNextQuestion}
        currentTopic="Albert Einstein"
      />
    );

    expect(screen.getByText(/Tema: Albert Einstein/)).toBeInTheDocument();
  });

  it("should display Wikipedia attribution in footer", () => {
    render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    expect(screen.getByText("Powered by Wikipedia & DuckDuckGo")).toBeInTheDocument();
  });

  it("should show loading overlay when loading is true", () => {
    render(
      <GameScreen
        trivia={mockTrivia}
        onAnswer={mockOnAnswer}
        onNextQuestion={mockOnNextQuestion}
        loading={true}
      />
    );

    expect(
      screen.getByText("Generando siguiente pregunta...")
    ).toBeInTheDocument();
  });

  it("should reset state when new question arrives", () => {
    const { rerender } = render(
      <GameScreen trivia={mockTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    const button = screen.getByText("París").closest("button");
    if (button) fireEvent.click(button);

    expect(screen.getByText("¡Correcto! ✓")).toBeInTheDocument();

    // Simulate new question
    const newTrivia = {
      ...mockTrivia,
      question: "New question",
    };
    rerender(
      <GameScreen trivia={newTrivia} onAnswer={mockOnAnswer} onNextQuestion={mockOnNextQuestion} />
    );

    expect(screen.queryByText("¡Correcto! ✓")).not.toBeInTheDocument();
    expect(screen.getByText("New question")).toBeInTheDocument();
  });
});
