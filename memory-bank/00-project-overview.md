# QuiziAI - Project Memory

## Project Identity
- Name: QuiziAI
- Type: AI-powered trivia game
- Stack: Next.js 14, TypeScript, React, Tailwind, Gemini AI
- Status: Active development
- Developer: Solo (Eric Bosch)

## Core Features
1. Infinite trivia questions from Wikipedia
2. AI-powered quiz generation (Gemini/Groq/HuggingFace fallback)
3. Mobile-first dark theme interface
4. Spanish Wikipedia integration

## Architecture Decisions
- App Router (not Pages Router)
- Client components for interactivity
- Server components for data fetching
- API routes for AI/Wikipedia integration
- No state management library (useState only)

## Critical Patterns
- Mobile-first design (portrait mode)
- Dark theme default
- Tailwind CSS only (no CSS modules)
- Provider fallback chain for AI
- Error handling in all async operations

## Current Issues/Concerns
- [List any known bugs]
- [List planned features]
- [List technical debt]

## DO NOT
- Use CSS modules or inline styles
- Add Redux/Zustand without discussion
- Change AI provider fallback logic
- Refactor without explicit approval

## LAST UPDATED
[Date and summary of last major change]