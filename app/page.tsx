"use client";

import { useState } from "react";
import GameScreen from "@/components/GameScreen";
import { generateTriviaFromContentServer } from "@/lib/server/game";
import { fetchWikipediaSummaryClient } from "@/lib/client/wikipedia-client";
import { fetchFallbackData } from "@/lib/client/fallback-data";
import { TriviaQuestion } from "@/lib/types";
import {
  getAllCategories,
  getRandomTopicFromCategory,
  getRandomTopicFromAnyCategory,
  getCategoryById,
  type Category,
} from "@/constants/topics";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [currentTopic, setCurrentTopic] = useState(""); // Persist topic for infinite questions
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null); // Track selected category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trivia, setTrivia] = useState<TriviaQuestion | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]); // Track asked questions

  const handleStartGame = async (topicToUse?: string, categoryOverride?: Category | null) => {
    let topicForGame: string;
    
    // Use categoryOverride if provided (for immediate use), otherwise use state
    const categoryToUse = categoryOverride !== undefined ? categoryOverride : selectedCategory;
    
    // If category is selected, always pick a random topic from that category
    if (categoryToUse) {
      topicForGame = getRandomTopicFromCategory(categoryToUse);
    } else {
      // Use provided topic or fallback to input field
      topicForGame = String(topicToUse || topic || "");
    }
    
    if (!topicForGame.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentTopic(topicForGame); // Store topic for current question

    try {
      // Try Wikipedia first (client-side)
      let summary = await fetchWikipediaSummaryClient(topicForGame.trim());

      // If Wikipedia fails, try fallback data source
      if (!summary || !summary.extract) {
        const fallbackData = await fetchFallbackData(topicForGame.trim());
        
        if (fallbackData && fallbackData.extract) {
          summary = {
            title: fallbackData.title,
            extract: fallbackData.extract,
          };
        }
      }

      if (!summary || !summary.extract) {
        console.error("❌ [GAME] No data found from any source");
        setError("No se encontró información sobre este tema. Intenta con otro tema o verifica tu conexión.");
        setLoading(false);
        return;
      }
      
      // Generate trivia from the content (server-side for AI)
      // Pass previously asked questions to avoid duplicates
      const result = await generateTriviaFromContentServer(
        summary.extract,
        askedQuestions
      );
      
      if (result.error) {
        console.error("❌ [GAME] AI error:", result.error);
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.trivia) {
        // Add question to asked questions list
        setAskedQuestions((prev) => [...prev, result.trivia!.question]);
        setTrivia(result.trivia);
      } else {
        console.error("❌ [GAME] No trivia generated");
        setError("No se pudo generar la trivia. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("💥 [GAME] Exception caught in handleStartGame:", error);
      if (error instanceof Error) {
        console.error("💥 [GAME] Error message:", error.message);
        console.error("💥 [GAME] Error stack:", error.stack);
      }
      setError(`Error al cargar la trivia: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }

    setLoading(false);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    // Note: Next question is now handled by GameScreen timer/button
  };

  const handleNextQuestion = async () => {
    // handleStartGame will automatically pick random topic from category if selected
    // or use current topic if no category is selected
    await handleStartGame();
  };

  const handleNewTopic = () => {
    setTrivia(null);
    setTopic("");
    setCurrentTopic("");
    setSelectedCategory(null); // Reset category selection
    setScore({ correct: 0, total: 0 });
    setAskedQuestions([]); // Reset asked questions
    setError(null);
  };

  if (trivia) {
    return (
      <GameScreen
        trivia={trivia}
        onAnswer={handleAnswer}
        onNextQuestion={handleNextQuestion}
        onNewTopic={handleNewTopic}
        score={score}
        loading={loading}
        currentTopic={currentTopic}
        category={selectedCategory ? getCategoryById(selectedCategory) : null}
      />
    );
  }

  const handleCategorySelect = (categoryId: Category) => {
    // Set the category (will be used for subsequent questions - random topic per question)
    setSelectedCategory(categoryId);
    // Clear manual topic input when category is selected
    setTopic("");
    // Start game - pass category directly to avoid state update delay
    handleStartGame(undefined, categoryId);
  };

  const handleSurpriseMe = () => {
    // Surprise Me picks a random category and uses it for gameplay
    const { category } = getRandomTopicFromAnyCategory();
    setSelectedCategory(category.id);
    // Clear manual topic input
    setTopic("");
    // Start game - pass category directly to avoid state update delay
    handleStartGame(undefined, category.id);
  };

  const categories = getAllCategories();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">QuiziAI 🧠</h1>

        {/* Quick Play Section - Tag Cloud Layout */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Juego Rápido</h2>
          <div className="flex flex-wrap gap-2">
            {/* Surprise Me Button */}
            <button
              onClick={handleSurpriseMe}
              disabled={loading}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all active:scale-95 ${
                selectedCategory === null && topic
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              🎲 Aleatorio
            </button>
            {/* Category Pills - Tag Cloud Style */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                disabled={loading}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all active:scale-95 ${
                  selectedCategory === category.id
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {category.emoji} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-gray-500">o</span>
          </div>
        </div>

        {/* Manual Input Section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium mb-2">
              Tema de trivia
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                // Clear category selection when user types manually
                if (selectedCategory && e.target.value.trim()) {
                  setSelectedCategory(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleStartGame();
                }
              }}
              placeholder="Ej: Albert Einstein, París, Fútbol..."
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={() => {
              // Clear category selection when using manual input
              if (selectedCategory) {
                setSelectedCategory(null);
              }
              handleStartGame();
            }}
            disabled={loading || !topic.trim()}
            className="w-full py-4 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
          >
            {loading ? "Generando trivia..." : "Comenzar"}
          </button>

          {score.total > 0 && (
            <div className="text-center text-sm text-gray-400">
              Puntuación: {score.correct}/{score.total}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-600">
          <p>Powered by Wikipedia & DuckDuckGo</p>
        </div>
      </div>
    </div>
  );
}
