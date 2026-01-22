"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TriviaQuestion } from "@/lib/ai";
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
}

const TIMER_DURATION = 10; // 10 seconds

export default function GameScreen({
  trivia,
  onAnswer,
  onNextQuestion,
  onNewTopic,
  score,
  loading = false,
  currentTopic,
  category,
}: GameScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const timerStartedRef = useRef<boolean>(false);

  // Update ref when selectedIndex changes
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const handleNextQuestion = useCallback(() => {
    if (selectedIndexRef.current === null) return; // Must have answered first
    
    const correct = selectedIndexRef.current === trivia.correctAnswerIndex;
    onAnswer(correct);
    
    // Reset state
    setSelectedIndex(null);
    setShowFeedback(false);
    setTimeLeft(null);
    timerStartedRef.current = false;
    
    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    // Call next question handler
    onNextQuestion();
  }, [trivia.correctAnswerIndex, onAnswer, onNextQuestion]);

  // Start timer when feedback is shown
  useEffect(() => {
    if (showFeedback && !timerStartedRef.current) {
      timerStartedRef.current = true;
      setTimeLeft(TIMER_DURATION);
      
      // Countdown timer
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev === undefined) {
            return TIMER_DURATION;
          }
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-advance after timer
      timerRef.current = setTimeout(() => {
        handleNextQuestion();
      }, TIMER_DURATION * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [showFeedback, handleNextQuestion]);

  // Reset timer when new question arrives
  useEffect(() => {
    setSelectedIndex(null);
    setShowFeedback(false);
    setTimeLeft(null);
    timerStartedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [trivia.question]);

  const handleOptionClick = (index: number) => {
    if (selectedIndex !== null) return; // Prevent multiple selections

    setSelectedIndex(index);
    const correct = index === trivia.correctAnswerIndex;
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const getButtonStyle = (index: number) => {
    if (selectedIndex === null) {
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

      {/* Progress Bar - Shows session progress */}
      {score && score.total > 0 && (
        <div className="px-4 pb-2">
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((score.total * 20) % 100, 100)}%` }}
            />
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
              ${selectedIndex === null ? "cursor-pointer" : "cursor-not-allowed"}
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
            
            {/* Timer and Next Button */}
            <div className="flex items-center justify-center gap-3">
              {timeLeft !== null && timeLeft > 0 && (
                <div className="text-xs text-gray-400">
                  Siguiente pregunta en {timeLeft}s
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
          <p>Powered by Wikipedia & DuckDuckGo</p>
          {currentTopic && (
            <p className="text-gray-700 mt-1">Tema: {currentTopic}</p>
          )}
        </div>
      </div>
    </div>
  );
}
