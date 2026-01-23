"use client";

import { TriviaQuestion } from "@/lib/types";

/**
 * Question cache to reduce AI API calls
 * Pre-generates questions and serves from cache when available
 */
export class QuestionCache {
  private cache: TriviaQuestion[] = [];
  private readonly minSize: number;
  private readonly targetSize: number;

  constructor(minSize: number = 2, targetSize: number = 10) {
    this.minSize = minSize;
    this.targetSize = targetSize;
  }

  /**
   * Get next question from cache, removing it
   */
  pop(): TriviaQuestion | null {
    return this.cache.shift() || null;
  }

  /**
   * Add question to cache
   */
  push(question: TriviaQuestion): void {
    this.cache.push(question);
  }

  /**
   * Add multiple questions to cache
   */
  pushMany(questions: TriviaQuestion[]): void {
    this.cache.push(...questions);
  }

  /**
   * Check if cache needs refilling
   */
  needsRefill(): boolean {
    return this.cache.length < this.minSize;
  }

  /**
   * Check if cache is empty
   */
  isEmpty(): boolean {
    return this.cache.length === 0;
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.length;
  }

  /**
   * Get target size for refilling
   */
  getTargetSize(): number {
    return this.targetSize;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache = [];
  }

  /**
   * Get all cached questions (for debugging)
   */
  getAll(): TriviaQuestion[] {
    return [...this.cache];
  }
}
