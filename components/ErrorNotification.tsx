"use client";

import { useEffect } from "react";

interface ErrorNotificationProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function ErrorNotification({
  error,
  onRetry,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}: ErrorNotificationProps) {
  useEffect(() => {
    if (error && autoHide && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [error, autoHide, autoHideDelay, onDismiss]);

  if (!error) return null;

  // Determine error type and message
  const isRateLimit = error === "RATE_LIMIT";
  const errorMessage = isRateLimit
    ? "Los servicios de IA están temporalmente saturados. Por favor, espera unos momentos y vuelve a intentar."
    : error;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <div
        className={`p-4 rounded-xl shadow-lg border ${
          isRateLimit
            ? "bg-yellow-900/90 border-yellow-700 text-yellow-100"
            : "bg-red-900/90 border-red-700 text-red-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-xl">
            {isRateLimit ? "⏳" : "⚠️"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm mb-1">
              {isRateLimit ? "Servicio temporalmente no disponible" : "Error"}
            </p>
            <p className="text-xs opacity-90">{errorMessage}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800/60 hover:bg-gray-700/60 transition-colors"
              >
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-2 py-1 text-xs rounded-lg hover:bg-gray-700/60 transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
