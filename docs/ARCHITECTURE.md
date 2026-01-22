# QuiziAI Architecture & Context Guide

**Purpose:** Quick context recovery for developers and AI assistants working on QuiziAI.

---

## 🎯 Project Overview

**QuiziAI** is a mobile-first trivia PWA that generates questions on-the-fly using AI. Users select topics (manually or via categories), and the app fetches content from Wikipedia, then uses AI (Gemini/Groq/Hugging Face) to generate trivia questions in Spanish.

**Key Characteristics:**
- **Zero-cost strategy:** All services use free tiers
- **Mobile-first:** Optimized for portrait mode, thumb-friendly UI
- **Resilient:** Multi-provider fallback system for AI and data sources
- **Type-safe:** Strict TypeScript throughout
- **Well-tested:** 86%+ coverage, 93 tests

---

## 📁 Project Structure

```
QuiziAI/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (mobile viewport, dark theme)
│   ├── page.tsx                 # Main game orchestrator (client component)
│   └── globals.css              # Dark theme, mobile-first styles
│
├── components/
│   └── GameScreen.tsx          # Game UI component (timer, buttons, feedback)
│
├── lib/                         # Core business logic
│   ├── ai.ts                   # AI service (multi-provider fallback)
│   ├── game.ts                 # Server action (AI generation wrapper)
│   ├── wikipedia-client.ts    # Client-side Wikipedia fetch (primary)
│   ├── fallback-data.ts        # Fallback data sources (English Wiki, DuckDuckGo)
│   └── logger.ts               # Server-side file logging utility
│
├── constants/
│   └── topics.ts               # Curated topics by category (8 categories, 120 topics)
│
├── __tests__/                  # Test suite (93 tests, 86% coverage)
│   ├── app/                    # Page component tests
│   ├── components/             # Component tests
│   ├── lib/                     # Service unit tests
│   └── constants/               # Data structure tests
│
└── docs/
    ├── ARCHITECTURE.md          # This file
    └── PRODUCT_LOG.md           # Development history and decisions
```

---

## 🔄 Data Flow & Architecture

### Game Flow (User Journey)

```
1. User selects topic/category
   ↓
2. app/page.tsx → handleStartGame()
   ↓
3. Fetch content (client-side):
   - wikipedia-client.ts → MediaWiki API (primary)
   - If fails → REST API fallback
   - If fails → fallback-data.ts → English Wiki / DuckDuckGo
   ↓
4. Send content to AI (server-side):
   - game.ts (server action) → ai.ts
   - ai.ts tries: Gemini → Groq → Hugging Face
   - Returns TriviaQuestion JSON
   ↓
5. Display question in GameScreen.tsx
   ↓
6. User answers → feedback → timer (10s) → next question
   ↓
7. Repeat from step 3 (same topic, new random question)
```

### Key Architectural Decisions

1. **Client-side data fetching** (`wikipedia-client.ts`)
   - **Why:** Avoids server-side blocking (Wikipedia 403 errors)
   - **How:** Browser makes direct API calls with CORS

2. **Server-side AI generation** (`game.ts` + `ai.ts`)
   - **Why:** API keys must stay server-side (security)
   - **How:** Next.js server actions ("use server")

3. **Multi-provider fallback** (`ai.ts`)
   - **Why:** Free tiers have quota limits
   - **How:** Try Gemini → Groq → Hugging Face sequentially

4. **Question deduplication**
   - **Why:** Avoid repetitive questions in same session
   - **How:** Track `askedQuestions[]` in state, pass to AI prompt

5. **Category-based gameplay**
   - **Why:** Better UX than manual input
   - **How:** Selected category persists, random topic per question

---

## 📦 Key Files & Their Purpose

### `app/page.tsx` (Main Orchestrator)
- **Type:** Client component ("use client")
- **Responsibilities:**
  - Game state management (topic, category, score, questions)
  - Data fetching orchestration (Wikipedia → fallback)
  - AI generation trigger (server action)
  - Category selection UI
  - Manual topic input
- **Key State:**
  - `selectedCategory`: Current category (persists across questions)
  - `askedQuestions`: Array of question strings (for deduplication)
  - `currentTopic`: Active topic for current question
- **Key Functions:**
  - `handleStartGame()`: Main game flow orchestrator
  - `handleCategorySelect()`: Category button handler
  - `handleSurpriseMe()`: Random category handler
  - `handleNextQuestion()`: Generate next question (same topic/category)

### `components/GameScreen.tsx` (Game UI)
- **Type:** Client component
- **Props:**
  - `trivia`: Current question data
  - `onAnswer`: Callback when user selects answer
  - `onNextQuestion`: Callback for next question (timer/button)
  - `category`: Category info (emoji + name) for header display
  - `score`: Current score object
  - `loading`: Loading state
- **Features:**
  - 10-second countdown timer (auto-advances)
  - Manual "Siguiente pregunta" button
  - Visual feedback (green/red) with fun fact
  - Category display in header
  - Progress bar

### `lib/ai.ts` (AI Service)
- **Type:** Server-side only ("use server")
- **Exports:**
  - `TriviaQuestion` interface
  - `generateTriviaFromContent(content, previousQuestions)`
- **Fallback Chain:**
  1. Gemini REST API v1 (direct fetch)
  2. Gemini SDK (fallback if REST fails)
  3. Groq API (Llama 3.1 8B)
  4. Hugging Face API (Mistral-7B)
- **Key Functions:**
  - `buildSystemPrompt(previousQuestions)`: Dynamic prompt with deduplication
  - `parseTriviaResponse(text)`: JSON extraction (handles markdown)
  - `tryGroqAPI()` / `tryHuggingFaceAPI()`: Fallback implementations

### `lib/game.ts` (Server Action Wrapper)
- **Type:** Server action ("use server")
- **Purpose:** Wrapper around `ai.ts` for Next.js server actions
- **Function:** `generateTriviaFromContentServer(content, previousQuestions)`
- **Returns:** `{ trivia: TriviaQuestion | null, error: string | null }`

### `lib/wikipedia-client.ts` (Data Fetching)
- **Type:** Client-side function
- **Function:** `fetchWikipediaSummaryClient(topic)`
- **Fallback Chain:**
  1. Spanish Wikipedia MediaWiki API
  2. Spanish Wikipedia REST API
- **Returns:** `{ title: string, extract: string } | null`

### `lib/fallback-data.ts` (Backup Data Sources)
- **Type:** Client-side function
- **Function:** `fetchFallbackData(topic)`
- **Fallback Chain:**
  1. English Wikipedia MediaWiki API
  2. DuckDuckGo Instant Answer API
- **Returns:** `{ title: string, extract: string } | null`

### `lib/logger.ts` (Server-Side Logging)
- **Type:** Server-side utility
- **Purpose:** Dual logging (console + file)
- **Features:**
  - Automatic log rotation (10MB limit)
  - Timestamped entries
  - Log levels (log, warn, error, debug)
- **Usage:** `const logger = createLogger("MODULE_NAME")`

### `constants/topics.ts` (Curated Topics)
- **Type:** Data structure + helper functions
- **Structure:**
  - `CATEGORIES`: Record of 8 categories
  - Each category: `{ id, name, emoji, topics: string[] }`
- **Exports:**
  - `getAllCategories()`: Returns all category info
  - `getRandomTopicFromCategory(categoryId)`: Random topic from category
  - `getRandomTopicFromAnyCategory()`: Random topic + category
  - `getCategoryById(categoryId)`: Category info by ID

---

## 🔌 API Integrations

### AI Providers (Server-Side)

**Gemini (Primary)**
- **Models:** `gemini-2.5-flash`, `gemini-3-flash-preview`, `gemini-2.5-pro`, `gemini-3-pro-preview`
- **API:** REST API v1 (primary), SDK (fallback)
- **Env Var:** `GEMINI_API_KEY`
- **Quota:** 15 RPM, 1M TPM (free tier)

**Groq (Fallback 1)**
- **Model:** `llama-3.1-8b-instant`
- **API:** OpenAI-compatible REST API
- **Env Var:** `GROQ_API_KEY`
- **Quota:** Free tier, very fast (~560 tokens/sec)

**Hugging Face (Fallback 2)**
- **Model:** `mistralai/Mistral-7B-Instruct-v0.2`
- **API:** Inference API
- **Env Var:** `HUGGINGFACE_API_KEY`
- **Quota:** ~300 req/hour (free tier)

### Data Sources (Client-Side)

**Spanish Wikipedia**
- **Primary:** MediaWiki API (`es.wikipedia.org/w/api.php`)
- **Fallback:** REST API (`es.wikipedia.org/api/rest_v1/page/summary/`)
- **No API key required**

**English Wikipedia (Fallback)**
- **API:** MediaWiki API (`en.wikipedia.org/w/api.php`)
- **No API key required**

**DuckDuckGo (Fallback)**
- **API:** Instant Answer API (`api.duckduckgo.com`)
- **No API key required**

---

## 🎨 UI Patterns & Conventions

### Mobile-First Design
- **Viewport:** `viewportFit: "cover"` (fullscreen on mobile)
- **Layout:** Portrait mode focus, thumb-friendly buttons
- **Colors:** Dark theme (black background, white text)
- **Buttons:** Large, bottom half of screen

### Styling
- **Framework:** Tailwind CSS
- **Theme:** Dark (black `#000000`, gray shades)
- **Typography:** System fonts, responsive sizes
- **Spacing:** Mobile-optimized padding/margins

### Component Patterns
- **Client components:** Use `"use client"` directive
- **Server actions:** Use `"use server"` directive
- **State management:** React hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- **Props:** Strictly typed with TypeScript interfaces

---

## 🧪 Testing Strategy

### Test Structure
- **Framework:** Jest + React Testing Library
- **Coverage:** 86.23% (Statements), 72.24% (Branches)
- **Total Tests:** 93 (all passing)

### Test Files
- `__tests__/app/page.test.tsx`: Category selection UI (8 tests)
- `__tests__/app/page-gameflow.test.tsx`: Game flow logic (9 tests)
- `__tests__/components/GameScreen.test.tsx`: UI interactions (12+ tests)
- `__tests__/lib/ai.test.ts`: AI service + fallback logic (15 tests)
- `__tests__/lib/game.test.ts`: Server action wrapper (7 tests)
- `__tests__/lib/wikipedia-client.test.ts`: Data fetching (6 tests)
- `__tests__/lib/fallback-data.test.ts`: Fallback sources (6 tests)
- `__tests__/lib/logger.test.ts`: Logging utility (11 tests)
- `__tests__/constants/topics.test.ts`: Data structure (15 tests)

### Testing Patterns
- **Mocking:** `jest.mock()` for external APIs
- **Async:** `waitFor()` for async operations
- **User events:** `fireEvent` for interactions
- **Server-side:** Mock `window` as `undefined` for logger tests

---

## 🔧 Common Tasks & How-To

### Adding a New AI Provider

1. **Add function in `lib/ai.ts`:**
   ```typescript
   async function tryNewProviderAPI(prompt: string): Promise<TriviaQuestion | null> {
     const apiKey = process.env.NEW_PROVIDER_API_KEY;
     if (!apiKey) return null;
     // Implementation
   }
   ```

2. **Add to fallback chain in `generateTriviaFromContent()`:**
   ```typescript
   const newProviderResult = await tryNewProviderAPI(prompt);
   if (newProviderResult) return newProviderResult;
   ```

3. **Update `.env.local.example`** with new API key

4. **Add tests in `__tests__/lib/ai.test.ts`**

### Adding a New Category

1. **Update `constants/topics.ts`:**
   - Add category to `Category` type union
   - Add entry to `CATEGORIES` object
   - Add 15 topics to `topics` array

2. **Update tests in `__tests__/constants/topics.test.ts`**

### Modifying Question Format

1. **Update `TriviaQuestion` interface in `lib/ai.ts`**
2. **Update `buildSystemPrompt()` in `lib/ai.ts`**
3. **Update `parseTriviaResponse()` in `lib/ai.ts`**
4. **Update `GameScreen.tsx` to display new fields**
5. **Update all tests that use `TriviaQuestion`**

### Debugging AI Generation

1. **Check logs:** `logs/quiziai.log` (server-side)
2. **Check console:** Browser DevTools (client-side)
3. **Check API responses:** Network tab in DevTools
4. **Verify API keys:** `.env.local` file

### Testing on Mobile

1. **Option 1 (WSL2):** Use `netsh` port forwarding (see `WSL2_MOBILE_ACCESS.md`)
2. **Option 2 (Recommended):** Use ngrok (see `QUICK_START_NGROK.md`)
   ```bash
   npm run dev:tunnel
   ```

---

## 🚨 Important Gotchas

1. **State Update Delay:** React state updates are async. Use `categoryOverride` parameter in `handleStartGame()` to bypass delay.

2. **Server vs Client:** 
   - `lib/ai.ts`, `lib/game.ts`, `lib/logger.ts` are server-only
   - `lib/wikipedia-client.ts`, `lib/fallback-data.ts` are client-only
   - `app/page.tsx` is client component (uses hooks)

3. **API Key Security:** Never expose API keys in client code. All AI calls must go through server actions.

4. **CORS Issues:** Wikipedia REST API may block server-side requests. Use client-side fetching (`wikipedia-client.ts`).

5. **Timer Management:** Use `useRef` for timer state to avoid stale closures in `useEffect`.

6. **Mock Clearing:** Always call `jest.clearAllMocks()` in `beforeEach` when using `jest.fn()` wrappers.

---

## 📊 Key Metrics & Status

- **Version:** 0.1.0
- **Test Coverage:** 86.23% (Statements)
- **Tests:** 93/93 passing (100%)
- **Build Status:** ✅ Passing
- **Lint Status:** ✅ No errors
- **TypeScript:** ✅ Strict mode

---

## 🔗 Related Documentation

- **README.md:** Setup, installation, mobile testing
- **docs/PRODUCT_LOG.md:** Development history, decisions, roadmap
- **TEST_STATUS.md:** Current test coverage and results
- **CHANGELOG.md:** Version history
- **WSL2_MOBILE_ACCESS.md:** WSL2 networking setup
- **QUICK_START_NGROK.md:** Quick ngrok setup guide

---

## 💡 Design Philosophy

1. **Zero Cost:** All services use free tiers
2. **Resilience:** Multiple fallbacks for critical paths
3. **Mobile-First:** Optimize for mobile, desktop works
4. **Type Safety:** Strict TypeScript, no `any` types
5. **Clean Code:** Modular, testable, well-documented
6. **User Experience:** Fast, responsive, clear feedback

---

**Last Updated:** 2026-01-22  
**Maintained By:** Solo-Dev (CEO/CTO)
