/**
 * Shared TypeScript types for QuiziAI
 * 
 * This file centralizes common types to avoid circular dependencies
 * and provide a single source of truth for type definitions.
 */

// Re-export TriviaQuestion from server module
export type { TriviaQuestion } from "./server/ai/index";

// Re-export WikipediaSummary from client module
export type { WikipediaSummary } from "./client/wikipedia-client";
