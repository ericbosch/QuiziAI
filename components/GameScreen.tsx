"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TriviaQuestion } from "@/lib/types";
import { CategoryInfo } from "@/constants/topics";

interface GameScreenProps {
  trivia: TriviaQuestion;
  onAnswer: (isCorrect: boolean) => void;
  onNextQuestion: () => void;
  onNewTopic?: () => void;
  score?: { correct: number; total: number };
  loading?: boolean;
  currentTopic?: string;
  category?: CategoryInfo | null;
  answerHistory?: boolean[]; // History of correct/incorrect answers for progress bar
}

const DECISION_TIMER_DURATION = 15; // 15 seconds to answer
const TRANSITION_TIMER_DURATION = 10; // 10 seconds to read feedback

export default function GameScreen({
  trivia,
  onAnswer,
  onNextQuestion,
  onNewTopic,
  score,
  loading = false,
  currentTopic,
  category,
  answerHistory = [],
}: GameScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [decisionTimeLeft, setDecisionTimeLeft] = useState<number | null>(null); // Timer A: Decision timer
  const [transitionTimeLeft, setTransitionTimeLeft] = useState<number | null>(null); // Timer B: Transition timer
  const decisionTimerRef = useRef<NodeJS.Timeout | null>(null); // Timeout for decision timer
  const decisionCountdownRef = useRef<NodeJS.Timeout | null>(null); // Interval for decision countdown
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null); // Timeout for transition timer
  const transitionCountdownRef = useRef<NodeJS.Timeout | null>(null); // Interval for transition countdown
  const selectedIndexRef = useRef<number | null>(null);
  const decisionTimerStartedRef = useRef<boolean>(false);
  const transitionTimerStartedRef = useRef<boolean>(false);

  // Update ref when selectedIndex changes
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const handleNextQuestion = useCallback(() => {
    // Reset state
    setSelectedIndex(null);
    setShowFeedback(false);
    setDecisionTimeLeft(null);
    setTransitionTimeLeft(null);
    decisionTimerStartedRef.current = false;
    transitionTimerStartedRef.current = false;
    
    // Clear all timers
    if (decisionTimerRef.current) {
      clearTimeout(decisionTimerRef.current);
      decisionTimerRef.current = null;
    }
    if (decisionCountdownRef.current) {
      clearInterval(decisionCountdownRef.current);
      decisionCountdownRef.current = null;
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (transitionCountdownRef.current) {
      clearInterval(transitionCountdownRef.current);
      transitionCountdownRef.current = null;
    }
    
    // Call next question handler
    onNextQuestion();
  }, [onNextQuestion]);

  // Timer A: Start decision timer when question appears
  useEffect(() => {
    if (!showFeedback && !decisionTimerStartedRef.current && selectedIndex === null) {
      decisionTimerStartedRef.current = true;
      setDecisionTimeLeft(DECISION_TIMER_DURATION);
      
      // Decision countdown timer
      decisionCountdownRef.current = setInterval(() => {
        setDecisionTimeLeft((prev) => {
          if (prev === null || prev === undefined) {
            return DECISION_TIMER_DURATION;
          }
          if (prev <= 1) {
            if (decisionCountdownRef.current) {
              clearInterval(decisionCountdownRef.current);
              decisionCountdownRef.current = null;
            }
            // Timeout: mark as incorrect and show feedback
            if (selectedIndexRef.current === null) {
              setSelectedIndex(-1); // Use -1 to indicate timeout
              setIsCorrect(false);
              setShowFeedback(true);
              onAnswer(false); // Mark as incorrect
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-timeout after decision timer
      decisionTimerRef.current = setTimeout(() => {
        if (selectedIndexRef.current === null) {
          setSelectedIndex(-1); // Use -1 to indicate timeout
          setIsCorrect(false);
          setShowFeedback(true);
          onAnswer(false); // Mark as incorrect
        }
      }, DECISION_TIMER_DURATION * 1000);
    }

    return () => {
      if (decisionTimerRef.current) {
        clearTimeout(decisionTimerRef.current);
        decisionTimerRef.current = null;
      }
      if (decisionCountdownRef.current) {
        clearInterval(decisionCountdownRef.current);
        decisionCountdownRef.current = null;
      }
    };
  }, [trivia.question, showFeedback, selectedIndex, onAnswer]);

  // Timer B: Start transition timer when feedback is shown
  useEffect(() => {
    if (showFeedback && !transitionTimerStartedRef.current) {
      transitionTimerStartedRef.current = true;
      setTransitionTimeLeft(TRANSITION_TIMER_DURATION);
      
      // Transition countdown timer
      transitionCountdownRef.current = setInterval(() => {
        setTransitionTimeLeft((prev) => {
          if (prev === null || prev === undefined) {
            return TRANSITION_TIMER_DURATION;
          }
          if (prev <= 1) {
            if (transitionCountdownRef.current) {
              clearInterval(transitionCountdownRef.current);
              transitionCountdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-advance after transition timer
      transitionTimerRef.current = setTimeout(() => {
        handleNextQuestion();
      }, TRANSITION_TIMER_DURATION * 1000);
    }

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      if (transitionCountdownRef.current) {
        clearInterval(transitionCountdownRef.current);
        transitionCountdownRef.current = null;
      }
    };
  }, [showFeedback, handleNextQuestion]);

  // Reset timers when new question arrives
  useEffect(() => {
    setSelectedIndex(null);
    setShowFeedback(false);
    setDecisionTimeLeft(null);
    setTransitionTimeLeft(null);
    decisionTimerStartedRef.current = false;
    transitionTimerStartedRef.current = false;
    if (decisionTimerRef.current) {
      clearTimeout(decisionTimerRef.current);
      decisionTimerRef.current = null;
    }
    if (decisionCountdownRef.current) {
      clearInterval(decisionCountdownRef.current);
      decisionCountdownRef.current = null;
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (transitionCountdownRef.current) {
      clearInterval(transitionCountdownRef.current);
      transitionCountdownRef.current = null;
    }
  }, [trivia.question]);

  const handleOptionClick = (index: number) => {
    if (selectedIndex !== null) return; // Prevent multiple selections

    // Clear decision timer
    if (decisionTimerRef.current) {
      clearTimeout(decisionTimerRef.current);
      decisionTimerRef.current = null;
    }
    if (decisionCountdownRef.current) {
      clearInterval(decisionCountdownRef.current);
      decisionCountdownRef.current = null;
    }

    setSelectedIndex(index);
    const correct = index === trivia.correctAnswerIndex;
    setIsCorrect(correct);
    setShowFeedback(true);
    onAnswer(correct);
  };

  const getButtonStyle = (index: number) => {
    if (selectedIndex === null || selectedIndex === -1) {
      // Timeout case: show correct answer
      if (selectedIndex === -1 && index === trivia.correctAnswerIndex) {
        return "bg-green-600 text-white";
      }
      return "bg-gray-800 hover:bg-gray-700 text-white";
    }

    if (index === trivia.correctAnswerIndex) {
      return "bg-green-600 text-white";
    }

    if (index === selectedIndex && !isCorrect) {
      return "bg-red-600 text-white";
    }

    return "bg-gray-800 text-gray-500";
  };

  const totalAnswers = answerHistory.length;
  const segmentCount = Math.min(totalAnswers, 10);
  const recentHistory = segmentCount > 0 ? answerHistory.slice(-segmentCount) : [];

  return (
    <div className="relative flex flex-col h-screen max-h-screen overflow-hidden bg-black text-white">
      {/* Header with category, score and restart button */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {category && (
            <div className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <span>{category.emoji}</span>
              <span>{category.name}</span>
            </div>
          )}
          {score && (
            <div className="text-sm text-gray-400">
              {score.correct}/{score.total}
            </div>
          )}
        </div>
        {onNewTopic && (
          <button
            onClick={onNewTopic}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
          >
            Nuevo tema
          </button>
        )}
      </div>

      {/* Segmented Progress Bar - Shows answer history */}
      {score && score.total > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-1.5 justify-center items-center">
            {Array.from({ length: segmentCount }).map((_, index) => {
              const isCorrect = recentHistory[index] ?? null;
              
              return (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCorrect === true
                      ? "bg-green-500 w-6"
                      : isCorrect === false
                      ? "bg-red-500 w-6"
                      : "bg-gray-700 w-2"
                  }`}
                />
              );
            })}
            {totalAnswers > 10 && (
              <span className="text-xs text-gray-500 ml-1">+{totalAnswers - 10}</span>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Generando siguiente pregunta...</p>
          </div>
        </div>
      )}

      {/* Question Section - Top Half */}
      <div className="flex-1 flex flex-col justify-center px-4 pt-4 pb-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-6 text-balance px-2">
            {trivia.question}
          </h2>
          {/* Decision Timer (Timer A) */}
          {!showFeedback && decisionTimeLeft !== null && decisionTimeLeft > 0 && (
            <div className="text-sm text-gray-400 mb-2">
              Tiempo restante: {decisionTimeLeft}s
            </div>
          )}
        </div>
      </div>

      {/* Options Section - Bottom Half */}
      <div className="flex-1 flex flex-col justify-end pb-8 px-4 gap-3">
        {trivia.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(index)}
            disabled={selectedIndex !== null}
            className={`
              w-full py-5 px-4 rounded-xl text-left font-medium
              transition-all duration-200
              active:scale-95
              ${getButtonStyle(index)}
              ${selectedIndex === null && !showFeedback ? "cursor-pointer" : "cursor-not-allowed"}
            `}
          >
            <span className="text-base">{option}</span>
          </button>
        ))}

        {/* Feedback Message with Timer and Next Button */}
        {showFeedback && (
          <div
            className={`
              mt-4 p-4 rounded-xl text-center font-medium
              transition-opacity duration-300
              ${isCorrect ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}
            `}
          >
            <p className="text-sm mb-2">
              {isCorrect ? "¡Correcto! ✓" : "Incorrecto ✗"}
            </p>
            <p className="text-xs opacity-90 mb-4">{trivia.funFact}</p>
            
            {/* Transition Timer (Timer B) and Next Button */}
            <div className="flex items-center justify-center gap-3">
              {transitionTimeLeft !== null && transitionTimeLeft > 0 && (
                <div className="text-xs text-gray-400">
                  Siguiente pregunta en {transitionTimeLeft}s
                </div>
              )}
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm text-white transition-colors"
              >
                Siguiente pregunta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer with attribution */}
      <div className="px-4 pb-4 pt-2">
        <div className="text-center text-xs text-gray-600">
          <p>Powered by Wikipedia</p>
          {currentTopic && (
            <p className="text-gray-700 mt-1">Tema: {currentTopic}</p>
          )}
        </div>
      </div>
    </div>
  );
}
