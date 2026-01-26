"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import GameScreen from "@/components/GameScreen";
import ErrorNotification from "@/components/ErrorNotification";
import { generateTriviaFromContentServer, generateTriviaBatch } from "@/lib/server/game";
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

const BATCH_SIZE = 10; // Batch size for question loading
const PRE_FETCH_THRESHOLD = 2; // Pre-fetch when queue has 2 questions left

// Spanish loading messages
const LOADING_MESSAGES = [
  "Consultando la Biblioteca de Alejandría...",
  "Interrogando a la IA sobre {category}...",
  "Limpiando el polvo de los libros...",
  "Sincronizando neuronas artificiales...",
];

export default function Home() {
  const [topic, setTopic] = useState("");
  const [currentTopic, setCurrentTopic] = useState(""); // Persist topic for infinite questions
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null); // Track selected category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trivia, setTrivia] = useState<TriviaQuestion | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]); // Track asked questions
  const [previousAnswerIndices, setPreviousAnswerIndices] = useState<number[]>([]); // Track answer indices for diversity
  const [notificationError, setNotificationError] = useState<string | null>(null); // Error for notification popup
  const [questionsQueue, setQuestionsQueue] = useState<TriviaQuestion[]>([]); // Queue for batch-loaded questions
  const [answerHistory, setAnswerHistory] = useState<boolean[]>([]); // Track answer history for progress bar
  const [loadingMessage, setLoadingMessage] = useState<string>(""); // Dynamic loading message
  // Use refs to always get latest values for async operations
  const askedQuestionsRef = useRef<string[]>([]);
  const previousAnswerIndicesRef = useRef<number[]>([]);
  const questionsQueueRef = useRef<TriviaQuestion[]>([]); // Ref for queue access in async operations
  const currentContentRef = useRef<string>(""); // Store current content for batch fetching
  const isFetchingBatchRef = useRef<boolean>(false); // Prevent multiple batch fetches
  const loadingMessageIntervalRef = useRef<NodeJS.Timeout | null>(null); // Interval for rotating messages
  // Sync ref with state
  useEffect(() => {
    questionsQueueRef.current = questionsQueue;
  }, [questionsQueue]);

  // Pre-fetch batch when queue is low
  const preFetchBatch = useCallback(async (content: string) => {
    if (isFetchingBatchRef.current) return;
    isFetchingBatchRef.current = true;

    try {
      console.log(`🔄 [QUEUE] Pre-fetching batch of ${BATCH_SIZE} questions`);
      const batch = await generateTriviaBatch(
        content,
        BATCH_SIZE,
        askedQuestionsRef.current,
        previousAnswerIndicesRef.current
      );

      if (batch.questions.length > 0) {
        // Add to queue
        setQuestionsQueue((prev) => {
          const updated = [...prev, ...batch.questions];
          questionsQueueRef.current = updated;
          console.log(`✅ [QUEUE] Added ${batch.questions.length} questions to queue (total: ${updated.length})`);
          return updated;
        });
      }

      if (batch.errors.some(e => e === "RATE_LIMIT")) {
        setNotificationError("RATE_LIMIT");
      }
    } catch (error) {
      console.error("❌ [QUEUE] Error pre-fetching batch:", error);
    } finally {
      isFetchingBatchRef.current = false;
    }
  }, [BATCH_SIZE]);


  const handleStartGame = useCallback(async (topicToUse?: string, categoryOverride?: Category | null) => {
    console.log("🎮 [GAME] handleStartGame called", { topicToUse, categoryOverride, selectedCategory });
    let topicForGame: string;

    // Use categoryOverride if provided (for immediate use), otherwise use state
    const categoryToUse = categoryOverride !== undefined ? categoryOverride : selectedCategory;

    // If category is selected, always pick a random topic from that category
    if (categoryToUse) {
      topicForGame = getRandomTopicFromCategory(categoryToUse);
      console.log("🎮 [GAME] Category selected, random topic:", topicForGame);
    } else {
      // Use provided topic or fallback to input field
      topicForGame = String(topicToUse || topic || "");
      console.log("🎮 [GAME] Manual topic:", topicForGame);
    }

    if (!topicForGame.trim()) {
      console.warn("⚠️ [GAME] No topic provided, returning early");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentTopic(topicForGame); // Store topic for current question
    
    // Start rotating loading messages
    let messageIndex = 0;
    const categoryName = categoryToUse ? getCategoryById(categoryToUse)?.name || "" : "";
    const updateLoadingMessage = () => {
      const baseMessage = LOADING_MESSAGES[messageIndex % LOADING_MESSAGES.length];
      const message = baseMessage.replace("{category}", categoryName || "el tema");
      setLoadingMessage(message);
      messageIndex++;
    };
    updateLoadingMessage(); // Show first message immediately
    loadingMessageIntervalRef.current = setInterval(updateLoadingMessage, 2000); // Rotate every 2 seconds

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
        if (loadingMessageIntervalRef.current) {
          clearInterval(loadingMessageIntervalRef.current);
          loadingMessageIntervalRef.current = null;
        }
        setLoadingMessage("");
        return;
      }

      // Store content for batch fetching
      currentContentRef.current = summary.extract;

      // Check queue first - dequeue a question
      let questionFromQueue: TriviaQuestion | null = null;
      if (questionsQueueRef.current.length > 0) {
        questionFromQueue = questionsQueueRef.current[0];
        // Remove from queue (dequeue)
        setQuestionsQueue((prev) => {
          const updated = prev.slice(1); // Remove first element
          questionsQueueRef.current = updated;
          console.log(`📥 [QUEUE] Dequeued question (remaining: ${updated.length})`);
          return updated;
        });
      }

      // If queue is empty, fetch a batch immediately
      if (!questionFromQueue) {
        console.log("🔄 [GAME] Queue empty, fetching initial batch...");
        const batch = await generateTriviaBatch(
          summary.extract,
          BATCH_SIZE,
          askedQuestionsRef.current,
          previousAnswerIndicesRef.current
        );

        if (batch.questions.length > 0) {
          // Add to queue
          setQuestionsQueue((prev) => {
            const updated = [...prev, ...batch.questions];
            questionsQueueRef.current = updated;
            console.log(`✅ [GAME] Generated ${batch.questions.length} questions, added to queue`);
            return updated;
          });

          // Dequeue first question
          questionFromQueue = batch.questions[0];
          setQuestionsQueue((prev) => {
            const updated = prev.slice(1);
            questionsQueueRef.current = updated;
            return updated;
          });

          // Handle rate limit errors
          if (batch.errors.some(e => e === "RATE_LIMIT")) {
            setNotificationError("RATE_LIMIT");
          }
        } else {
          // Batch generation failed, try single question as fallback
          console.warn("⚠️ [GAME] Batch generation failed, trying single question...");
          const result = await generateTriviaFromContentServer(
            summary.extract,
            askedQuestionsRef.current,
            previousAnswerIndicesRef.current
          );

          if (result.error) {
            console.error("❌ [GAME] AI error:", result.error);
            if (result.error === "RATE_LIMIT") {
              setNotificationError("RATE_LIMIT");
              setError("Los servicios de IA están temporalmente saturados. Por favor, espera unos momentos.");
            } else {
              setError(result.error);
            }
            setLoading(false);
            if (loadingMessageIntervalRef.current) {
              clearInterval(loadingMessageIntervalRef.current);
              loadingMessageIntervalRef.current = null;
            }
            setLoadingMessage("");
            return;
          }

          if (result.trivia) {
            questionFromQueue = result.trivia;
            } else {
              setError("No se pudo generar la trivia. Intenta de nuevo.");
              setLoading(false);
              if (loadingMessageIntervalRef.current) {
                clearInterval(loadingMessageIntervalRef.current);
                loadingMessageIntervalRef.current = null;
              }
              setLoadingMessage("");
              return;
            }
        }
      }

      // Check for duplicates and find a valid question
      if (questionFromQueue) {
        // Loop until we find a non-duplicate question
        let attempts = 0;
        const maxAttempts = 20; // Prevent infinite loops
        
        while (attempts < maxAttempts) {
          const isDuplicate = askedQuestionsRef.current.some(
            (q) => q.toLowerCase().trim() === questionFromQueue!.question.toLowerCase().trim()
          );

          if (!isDuplicate) {
            // Found a valid non-duplicate question
            break;
          }

          // Duplicate found, try next question from queue
          console.warn(`⚠️ [GAME] Duplicate question (attempt ${attempts + 1}), trying next...`);
          
          if (questionsQueueRef.current.length > 0) {
            questionFromQueue = questionsQueueRef.current[0];
            setQuestionsQueue((prev) => {
              const updated = prev.slice(1);
              questionsQueueRef.current = updated;
              return updated;
            });
            attempts++;
          } else {
            // Queue exhausted, fetch new batch
            console.warn("⚠️ [GAME] Queue exhausted, fetching new batch...");
            const batch = await generateTriviaBatch(
              summary.extract,
              BATCH_SIZE,
              askedQuestionsRef.current,
              previousAnswerIndicesRef.current
            );

            if (batch.questions.length > 0) {
              setQuestionsQueue((prev) => {
                const updated = [...prev, ...batch.questions];
                questionsQueueRef.current = updated;
                return updated;
              });
              questionFromQueue = batch.questions[0];
              setQuestionsQueue((prev) => {
                const updated = prev.slice(1);
                questionsQueueRef.current = updated;
                return updated;
              });
              attempts++;
            } else {
              setError("No se pudo generar una pregunta válida. Intenta con otro tema.");
              setLoading(false);
              if (loadingMessageIntervalRef.current) {
                clearInterval(loadingMessageIntervalRef.current);
                loadingMessageIntervalRef.current = null;
              }
              setLoadingMessage("");
              return;
            }
          }
        }

        // If we still have a duplicate after max attempts, use it anyway (better than nothing)
        if (attempts >= maxAttempts && questionFromQueue) {
          console.warn("⚠️ [GAME] Max attempts reached, using question despite potential duplicate");
        }

        // Use the question
        if (questionFromQueue) {
          const newQuestions = [...askedQuestionsRef.current, questionFromQueue.question];
          const newIndices = [...previousAnswerIndicesRef.current, questionFromQueue.correctAnswerIndex];
          setAskedQuestions(newQuestions);
          setPreviousAnswerIndices(newIndices);
          askedQuestionsRef.current = newQuestions;
          previousAnswerIndicesRef.current = newIndices;
          setTrivia(questionFromQueue);
          setLoading(false);
          // Stop loading messages
          if (loadingMessageIntervalRef.current) {
            clearInterval(loadingMessageIntervalRef.current);
            loadingMessageIntervalRef.current = null;
          }
          setLoadingMessage("");

          // Pre-fetch next batch if queue is low (2 or fewer questions)
          if (questionsQueueRef.current.length <= PRE_FETCH_THRESHOLD && !isFetchingBatchRef.current) {
            preFetchBatch(summary.extract);
          }
          return;
        }
      }

      // Fallback: if we still don't have a question, show error
      console.error("❌ [GAME] Could not generate any questions");
      setError("No se pudo generar la trivia. Intenta de nuevo.");
      setLoading(false);
      return;
    } catch (error) {
      console.error("💥 [GAME] Exception caught in handleStartGame:", error);
      if (error instanceof Error) {
        console.error("💥 [GAME] Error message:", error.message);
        console.error("💥 [GAME] Error stack:", error.stack);
      }
      setError(`Error al cargar la trivia: ${error instanceof Error ? error.message : "Error desconocido"}`);
      setLoading(false);
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
        loadingMessageIntervalRef.current = null;
      }
      setLoadingMessage("");
    }
  }, [topic, selectedCategory, preFetchBatch]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    // Track answer history for progress bar
    setAnswerHistory((prev) => [...prev, isCorrect]);
    // Note: Next question is now handled by GameScreen timer/button
  }, []);

  const handleNextQuestion = useCallback(async () => {
    console.log("🔄 [GAME] handleNextQuestion called");
    console.log("📊 [GAME] Queue size:", questionsQueueRef.current.length);
    console.log("📊 [GAME] Current content available:", !!currentContentRef.current);
    
    // If we have questions in queue, use them directly without fetching new content
    if (questionsQueueRef.current.length > 0) {
      console.log("📥 [GAME] Using question from queue");
      let questionFromQueue = questionsQueueRef.current[0];
      
      // Dequeue
      setQuestionsQueue((prev) => {
        const updated = prev.slice(1);
        questionsQueueRef.current = updated;
        console.log(`📥 [QUEUE] Dequeued question (remaining: ${updated.length})`);
        return updated;
      });

      // Check for duplicates - loop until we find a non-duplicate
      let attempts = 0;
      const maxAttempts = questionsQueueRef.current.length + 5; // Allow checking queue + some buffer
      
      while (attempts < maxAttempts) {
        const isDuplicate = askedQuestionsRef.current.some(
          (q) => q.toLowerCase().trim() === questionFromQueue.question.toLowerCase().trim()
        );

        if (!isDuplicate) {
          // Found valid question
          const newQuestions = [...askedQuestionsRef.current, questionFromQueue.question];
          const newIndices = [...previousAnswerIndicesRef.current, questionFromQueue.correctAnswerIndex];
          setAskedQuestions(newQuestions);
          setPreviousAnswerIndices(newIndices);
          askedQuestionsRef.current = newQuestions;
          previousAnswerIndicesRef.current = newIndices;
          setTrivia(questionFromQueue);
          console.log("✅ [GAME] Question set from queue");

          // Pre-fetch next batch if queue is low
          if (questionsQueueRef.current.length <= PRE_FETCH_THRESHOLD && currentContentRef.current && !isFetchingBatchRef.current) {
            console.log("🔄 [GAME] Queue low, pre-fetching batch...");
            preFetchBatch(currentContentRef.current);
          }
          return;
        }

        // Duplicate found, try next from queue
        console.warn(`⚠️ [GAME] Duplicate question (attempt ${attempts + 1}), trying next...`);
        if (questionsQueueRef.current.length > 0) {
          questionFromQueue = questionsQueueRef.current[0];
          setQuestionsQueue((prev) => {
            const updated = prev.slice(1);
            questionsQueueRef.current = updated;
            return updated;
          });
          attempts++;
        } else {
          // Queue exhausted, break to fetch new batch
          console.warn("⚠️ [GAME] Queue exhausted while checking duplicates");
          break;
        }
      }
    }

    // If queue is empty or all questions are duplicates, fetch new content and batch
    // But only if we have content available - otherwise we need to fetch new topic
    if (currentContentRef.current && selectedCategory) {
      // We have content and a category - generate a new batch from a new random topic
      console.log("🔄 [GAME] Queue empty, generating new batch from category...");
      const newTopic = getRandomTopicFromCategory(selectedCategory);
      setCurrentTopic(newTopic);
      
      // Fetch content and generate batch
      try {
        setLoading(true);
        let summary = await fetchWikipediaSummaryClient(newTopic.trim());
        
        if (!summary || !summary.extract) {
          const fallbackData = await fetchFallbackData(newTopic.trim());
          if (fallbackData && fallbackData.extract) {
            summary = { title: fallbackData.title, extract: fallbackData.extract };
          }
        }
        
        if (summary && summary.extract) {
          currentContentRef.current = summary.extract;
          const batch = await generateTriviaBatch(
            summary.extract,
            BATCH_SIZE,
            askedQuestionsRef.current,
            previousAnswerIndicesRef.current
          );
          
          if (batch.questions.length > 0) {
            setQuestionsQueue((prev) => {
              const updated = [...prev, ...batch.questions];
              questionsQueueRef.current = updated;
              console.log(`✅ [GAME] Generated ${batch.questions.length} questions, added to queue`);
              return updated;
            });
            
            // Use first question from batch
            const questionFromQueue = batch.questions[0];
            setQuestionsQueue((prev) => {
              const updated = prev.slice(1);
              questionsQueueRef.current = updated;
              return updated;
            });
            
            const newQuestions = [...askedQuestionsRef.current, questionFromQueue.question];
            const newIndices = [...previousAnswerIndicesRef.current, questionFromQueue.correctAnswerIndex];
            setAskedQuestions(newQuestions);
            setPreviousAnswerIndices(newIndices);
            askedQuestionsRef.current = newQuestions;
            previousAnswerIndicesRef.current = newIndices;
            setTrivia(questionFromQueue);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("❌ [GAME] Error generating batch:", error);
      }
      setLoading(false);
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
        loadingMessageIntervalRef.current = null;
      }
      setLoadingMessage("");
    } else if (!currentContentRef.current) {
      // No content available, need to start fresh
      console.log("🔄 [GAME] No content available, starting fresh...");
      await handleStartGame();
    } else {
      // Have content but no category - regenerate batch from same content
      console.log("🔄 [GAME] Queue empty, regenerating batch from same content...");
      const batch = await generateTriviaBatch(
        currentContentRef.current,
        BATCH_SIZE,
        askedQuestionsRef.current,
        previousAnswerIndicesRef.current
      );
      
      if (batch.questions.length > 0) {
        setQuestionsQueue((prev) => {
          const updated = [...prev, ...batch.questions];
          questionsQueueRef.current = updated;
          console.log(`✅ [GAME] Regenerated ${batch.questions.length} questions, added to queue`);
          return updated;
        });
        
        // Use first question from batch
        const questionFromQueue = batch.questions[0];
        setQuestionsQueue((prev) => {
          const updated = prev.slice(1);
          questionsQueueRef.current = updated;
          return updated;
        });
        
        const newQuestions = [...askedQuestionsRef.current, questionFromQueue.question];
        const newIndices = [...previousAnswerIndicesRef.current, questionFromQueue.correctAnswerIndex];
        setAskedQuestions(newQuestions);
        setPreviousAnswerIndices(newIndices);
        askedQuestionsRef.current = newQuestions;
        previousAnswerIndicesRef.current = newIndices;
        setTrivia(questionFromQueue);
        return;
      }
    }
  }, [handleStartGame, preFetchBatch, selectedCategory]);

  const handleNewTopic = useCallback(() => {
    setTrivia(null);
    setTopic("");
    setCurrentTopic("");
    setSelectedCategory(null); // Reset category selection
    setScore({ correct: 0, total: 0 });
    setAskedQuestions([]); // Reset asked questions
    setPreviousAnswerIndices([]); // Reset answer indices
    setQuestionsQueue([]); // Reset queue
    setAnswerHistory([]); // Reset answer history
    askedQuestionsRef.current = []; // Reset refs
    previousAnswerIndicesRef.current = []; // Reset refs
    questionsQueueRef.current = []; // Reset queue ref
    currentContentRef.current = ""; // Reset content ref
    isFetchingBatchRef.current = false; // Reset fetching flag
    if (loadingMessageIntervalRef.current) {
      clearInterval(loadingMessageIntervalRef.current);
      loadingMessageIntervalRef.current = null;
    }
    setLoadingMessage("");
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setNotificationError(null);
    setError(null);
    if (currentContentRef.current) {
      handleStartGame();
    }
  }, [handleStartGame]);

  if (trivia) {
    return (
      <>
        <ErrorNotification
          error={notificationError}
          onRetry={handleRetry}
          onDismiss={() => setNotificationError(null)}
          autoHide={false}
        />
        <GameScreen
          trivia={trivia}
          onAnswer={handleAnswer}
          onNextQuestion={handleNextQuestion}
          onNewTopic={handleNewTopic}
          score={score}
          loading={loading}
          currentTopic={currentTopic}
          category={selectedCategory ? getCategoryById(selectedCategory) : null}
          answerHistory={answerHistory}
        />
      </>
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
    <>
      <ErrorNotification
        error={notificationError}
        onRetry={handleRetry}
        onDismiss={() => setNotificationError(null)}
        autoHide={false}
      />
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">QuiziAI 🧠</h1>

        {/* Quick Play Section - Tag Cloud Layout */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Juego Rápido</h2>
          {loading && !trivia && (
            <div className="mb-4 flex items-center justify-center gap-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm">{loadingMessage || "Cargando categoría..."}</span>
            </div>
          )}
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
    </>
  );
}
