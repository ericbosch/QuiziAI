import { buildTriviaPrompt } from "@/lib/server/ai/prompt-builder";

describe("Prompt Builder", () => {
  it("should build single question prompt", () => {
    const context = {
      previousQuestions: [],
      previousAnswerIndices: [],
      questionCount: 1,
      content: "Test content about Einstein",
    };

    const result = buildTriviaPrompt(context);

    expect(result.userPrompt).toContain("una pregunta");
    expect(result.userPrompt).toContain("Test content about Einstein");
    expect(result.systemPrompt).toBeDefined();
  });

  it("should build batch prompt", () => {
    const context = {
      previousQuestions: [],
      previousAnswerIndices: [],
      questionCount: 10,
      content: "Test content",
    };

    const result = buildTriviaPrompt(context);

    expect(result.userPrompt).toContain("10 preguntas");
    expect(result.userPrompt).toContain('"questions"');
  });

  it("should include previous questions in prompt", () => {
    const context = {
      previousQuestions: ["Question 1", "Question 2"],
      previousAnswerIndices: [],
      questionCount: 1,
      content: "Test content",
    };

    const result = buildTriviaPrompt(context);

    expect(result.userPrompt).toContain("Question 1");
    expect(result.userPrompt).toContain("Question 2");
  });

  it("should include previous answer indices in prompt", () => {
    const context = {
      previousQuestions: [],
      previousAnswerIndices: [0, 1, 2],
      questionCount: 1,
      content: "Test content",
    };

    const result = buildTriviaPrompt(context);

    expect(result.userPrompt).toContain("0, 1, 2");
  });

  it("should handle batch with previous questions", () => {
    const context = {
      previousQuestions: ["Question 1", "Question 2"],
      previousAnswerIndices: [0, 1],
      questionCount: 5,
      content: "Test content",
    };

    const result = buildTriviaPrompt(context);

    expect(result.userPrompt).toContain("5 preguntas");
    expect(result.userPrompt).toContain("Question 1");
    expect(result.userPrompt).toContain("Question 2");
    expect(result.userPrompt).toContain("preguntas COMPLETAMENTE DIFERENTES");
  });

  it("should handle single question with previous questions", () => {
    const context = {
      previousQuestions: ["Question 1"],
      previousAnswerIndices: [0],
      questionCount: 1,
      content: "Test content",
    };

    const result = buildTriviaPrompt(context);

    expect(result.userPrompt).toContain("una pregunta");
    expect(result.userPrompt).toContain("Question 1");
    expect(result.userPrompt).toContain("una pregunta COMPLETAMENTE DIFERENTE");
  });
});
