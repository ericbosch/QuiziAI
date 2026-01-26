# QuiziAI - Project Memory

## Project Identity
- Name: QuiziAI
- Type: Mobile-first trivia PWA (Spanish UI)
- Stack: Next.js 14, TypeScript, React, Tailwind, Gemini/Groq/HuggingFace
- Status: v1.0.0-alpha (production-ready)
- Developer: Solo (Eric Bosch)

## Core Features
1. Infinite trivia questions from Wikipedia (Spanish → English fallback)
2. AI-powered quiz generation (Gemini → Groq → HuggingFace fallback)
3. Queue-based batching (10 questions per batch, prefetch at ≤2)
4. Dual-timer gameplay (15s answer + 10s transition)
5. Dark, mobile-first interface with Spanish content

## Architecture Decisions
- App Router (Next.js 14)
- Client components for UI; server actions for AI only
- Wikipedia fetch is client-side only (avoid 403 blocking)
- `lib/server/*` server-only; `lib/client/*` client-only; `lib/shared/*` safe
- No external state library (useState/useRef only)

## Critical Patterns
- Use `questionsQueue` + refs (no question-cache)
- Track `askedQuestions` and `previousAnswerIndices`
- Memoize callbacks passed to `GameScreen`
- Language policy: UI Spanish; docs/logs/commits English

## Current Issues/Concerns
- Keep test counts in sync with `TEST_STATUS.md`
- Avoid adding non-Wikipedia data sources without product decision

## DO NOT
- Import server-only modules into client components
- Use CSS modules or inline styles
- Add Redux/Zustand without discussion
- Reintroduce `question-cache.ts`

## LAST UPDATED
2026-01-26 - Documentation consolidation and Wikipedia-only policy