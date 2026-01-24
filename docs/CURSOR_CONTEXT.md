# QuiziAI - Cursor Context Recovery Guide

**Purpose:** Instant context recovery for AI assistants (Claude, GPT, etc.) working on QuiziAI.  
**Last Updated:** 2026-01-24  
**Version:** 1.0.0-alpha

---

## 🎯 PROJECT IDENTITY

**QuiziAI** is a mobile-first trivia PWA that generates infinite questions on-the-fly using AI and Wikipedia.

**Core Characteristics:**
- **Zero-cost:** All services use free tiers (Gemini/Groq/HuggingFace, Wikipedia, Vercel)
- **Mobile-first:** Portrait mode, thumb-friendly, dark theme
- **Resilient:** Multi-provider fallback chains (AI + data sources)
- **Type-safe:** Strict TypeScript, no `any` types
- **Well-tested:** 68.11% coverage (132 unit + 6 E2E tests)

**Status:**
- Version: 1.0.0-alpha
- Build: ✅ Passing
- Tests: ✅ 138/138 passing
- Deployment: Production-ready (Vercel)

---

## 📁 PROJECT STRUCTURE (CURRENT)

```
QuiziAI/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (viewport, dark theme)
│   ├── page.tsx                 # Main game orchestrator (CLIENT)
│   └── globals.css              # Dark theme, mobile styles
│
├── components/
│   ├── GameScreen.tsx          # Game UI (timer, segmented progress)
│   └── ErrorNotification.tsx   # API error popup (rate limits)
│
├── lib/
│   ├── server/                  # SERVER-ONLY CODE
│   │   ├── ai/
│   │   │   ├── index.ts        # AI orchestrator (fallback chain)
│   │   │   ├── prompt-builder.ts # Unified prompt generation
│   │   │   ├── types.ts        # AI types
│   │   │   └── providers/
│   │   │       ├── base.ts     # AIProvider interface
│   │   │       ├── gemini.ts   # Gemini implementation
│   │   │       ├── groq.ts     # Groq implementation
│   │   │       └── huggingface.ts # HuggingFace implementation
│   │   ├── game.ts             # Server action (batch generation)
│   │   └── logger.ts           # File logging (dev only)
│   │
│   ├── client/                  # CLIENT-ONLY CODE
│   │   ├── wikipedia-client.ts # Wikipedia fetch (primary)
│   │   ├── fallback-data.ts    # Backup data sources
│   │   ├── mock-provider.ts    # Spanish mock questions (testing)
│   │   └── question-cache.ts   # DEPRECATED (use queue instead)
│   │
│   └── types.ts                # Shared types
│
├── constants/
│   └── topics.ts               # 8 categories, 120 topics
│
├── __tests__/                  # 132 unit tests
├── e2e/                        # 6 Playwright tests
├── scripts/                    # Dev/build scripts
└── docs/                       # Documentation
    ├── guides/                 # Setup guides
    ├── ARCHITECTURE.md         # Full architecture
    ├── PRODUCT_LOG.md          # Development history
    ├── QUICK_REFERENCE.md      # Quick reference
    └── CURSOR_CONTEXT.md       # This file
```

**CRITICAL RULES:**
- ✅ `lib/server/*` is SERVER-ONLY (uses "use server" directive)
- ✅ `lib/client/*` is CLIENT-ONLY (browser APIs only)
- ✅ `app/page.tsx` is CLIENT component ("use client")
- ❌ NEVER import server code in client components
- ❌ NEVER use `fs` or Node.js APIs in client code

---

## 🔄 DATA FLOW (CRITICAL UNDERSTANDING)

### User Journey (Queue-Based Batching)

```
1. User selects category/topic
   ↓
2. app/page.tsx → handleStartGame()
   ↓
3. Fetch Wikipedia content (CLIENT-SIDE):
   - lib/client/wikipedia-client.ts → MediaWiki API (Spanish)
   - Fallback → REST API
   - Fallback → English Wikipedia
   - Fallback → DuckDuckGo
   ↓
4. Get question (QUEUE-FIRST):
   - Check questionsQueue state
   - If queue has questions → dequeue
   - If queue empty → generateTriviaBatch(10)
   - If queue ≤2 → background pre-fetch next batch
   ↓
5. AI Generation (SERVER-SIDE):
   - lib/server/game.ts → generateTriviaBatch()
   - lib/server/ai/index.ts → Provider fallback chain
   - Gemini → Groq → HuggingFace (automatic)
   - Returns batch of 10 questions
   ↓
6. Display in GameScreen.tsx
   - Dual-timer system (15s decision + 10s transition)
   - Segmented progress bar (10 dots)
   - Answer feedback with fun fact
   ↓
7. Next question
   - Dequeue from questionsQueue
   - Pre-fetch when ≤2 questions remain
   - New random topic if category selected
   ↓
8. Repeat from step 4
```

### Provider Fallback Chains

**AI Providers (automatic failover):**
```
Gemini (2.5/3 Flash/Pro) → Groq (Llama 3.1 8B) → HuggingFace (Mistral-7B)
```

**Data Sources (automatic failover):**
```
Spanish Wiki (MediaWiki) → Spanish Wiki (REST) → English Wiki → DuckDuckGo
```

---

## 🔑 KEY STATE MANAGEMENT

### Critical State Variables (`app/page.tsx`)

```typescript
// Game State
const [selectedCategory, setSelectedCategory] = useState(null)
const [currentTopic, setCurrentTopic] = useState('')
const [trivia, setTrivia] = useState(null)
const [score, setScore] = useState({ correct: 0, total: 0 })

// Queue System (CURRENT IMPLEMENTATION)
const [questionsQueue, setQuestionsQueue] = useState([])
const questionsQueueRef = useRef([])

// Deduplication & Diversity
const [askedQuestions, setAskedQuestions] = useState([])
const [previousAnswerIndices, setPreviousAnswerIndices] = useState([])

// UI State
const [notificationError, setNotificationError] = useState(null)
const [answerHistory, setAnswerHistory] = useState([])
```

**Queue Management:**
- `BATCH_SIZE = 10` questions per batch
- `PRE_FETCH_THRESHOLD = 2` (fetch new batch when ≤2 remain)
- Dequeue first, generate batch when empty
- Background pre-fetching for smooth UX

---

## 🎨 UI/UX PATTERNS

### Mobile-First Design
- **Viewport:** `viewportFit: "cover"` (fullscreen)
- **Layout:** Portrait mode, thumb-friendly buttons (bottom half)
- **Colors:** Black `#000000` background, white text
- **Theme:** Dark-only (no light mode)

### GameScreen Components
- **Dual-timer system:**
  - Timer A: 15s decision (answer or timeout)
  - Timer B: 10s transition (read fun fact)
- **Segmented progress bar:**
  - 10 dots: Green (correct), Red (incorrect), Grey (pending)
  - Shows "+N" if >10 questions
- **Dynamic loading messages:**
  - Rotates every 2s during initial load
  - Spanish messages (e.g., "Consultando la Biblioteca de Alejandría...")

### Error Handling
- **ErrorNotification popup** for API failures
- Distinguishes `RATE_LIMIT` errors with retry option
- Auto-hide for non-critical errors

---

## 🔌 API INTEGRATIONS

### AI Providers (Server-Side)

**Environment Variables (at least ONE required):**
```bash
GEMINI_API_KEY=...          # Primary (may hit quota: 15 RPM, 1M TPM)
GROQ_API_KEY=...            # Fast fallback (free tier, ~560 tok/sec)
HUGGINGFACE_API_KEY=...     # Rate-limited fallback (~300 req/hour)
```

**Provider Abstraction:**
- Base interface: `AIProvider` (`lib/server/ai/providers/base.ts`)
- Implementations: Gemini, Groq, HuggingFace
- Unified prompts: `buildTriviaPrompt()` in `prompt-builder.ts`
- Easy expansion: Implement `AIProvider` for new providers

### Data Sources (Client-Side)

**Wikipedia (no API key):**
- Spanish Wikipedia MediaWiki API (primary)
- Spanish Wikipedia REST API (fallback)
- English Wikipedia (fallback)

**DuckDuckGo (no API key):**
- Instant Answer API (final fallback)

---

## 🧪 TESTING STRATEGY

### Test Coverage
- **Total:** 138 tests (132 unit + 6 E2E)
- **Coverage:** 68.11% overall
  - `lib/server/ai`: 98.36% ✅
  - `lib/server`: 88.07% ✅
  - `components`: 79.73% ✅
  - `app/page.tsx`: 48.36% (covered by E2E)

### Test Commands
```bash
npm test                    # All unit tests
npm run test:coverage       # With coverage report
npm run test:e2e           # Playwright E2E tests
npm run test:e2e:ui        # E2E with UI
```

### Mock Provider (Testing)
```bash
NEXT_PUBLIC_USE_MOCKS=true  # Use Spanish mock questions
```

---

## 🚨 CRITICAL GOTCHAS

### 1. Server vs Client Code
❌ **NEVER** import `lib/server/*` in client components  
✅ **ALWAYS** use server actions for AI operations  
✅ **ALWAYS** use client-side fetch for Wikipedia

### 2. State Update Delays
❌ Don't rely on state immediately after `setState()`  
✅ Use `categoryOverride` parameter in `handleStartGame()`  
✅ Use refs for async operations (`questionsQueueRef`)

### 3. Timer Management
❌ Don't put `timeLeft` in `useEffect` dependencies  
✅ Use `timerStartedRef` to prevent re-runs  
✅ Clean up timers in `useEffect` return function

### 4. Question Queue
❌ Don't use deprecated `question-cache.ts`  
✅ Use `questionsQueue` state with refs  
✅ Pre-fetch when `queue.length ≤ 2`

### 5. Production Logging
❌ `fs` operations fail in Vercel production  
✅ Logger checks `NODE_ENV === 'production'` and uses console only  
✅ File logging only works in development

---

## 🔧 COMMON DEVELOPMENT TASKS

### Adding a New AI Provider

1. **Create provider implementation:**
```typescript
// lib/server/ai/providers/newprovider.ts
import type { AIProvider } from './base'

export const newProvider: AIProvider = {
  async isAvailable() {
    return !!process.env.NEW_PROVIDER_API_KEY
  },
  
  async generate(prompt: string, questionCount: number) {
    // Implementation
  }
}
```

2. **Add to fallback chain:**
```typescript
// lib/server/ai/index.ts
const providers = [geminiProvider, groqProvider, newProvider, huggingfaceProvider]
```

3. **Update `.env.local.example`**
4. **Add tests**

### Adding a New Category

1. **Update type union:**
```typescript
// constants/topics.ts
export type Category = 
  | 'history' | 'science' | 'cinema' 
  | 'geography' | 'sports' | 'literature' 
  | 'art' | 'music' | 'newcategory'
```

2. **Add to CATEGORIES object:**
```typescript
export const CATEGORIES: Record = {
  // ... existing
  newcategory: {
    id: 'newcategory',
    name: 'Nueva Categoría',
    emoji: '🆕',
    topics: [
      'Topic 1', 'Topic 2', ... // 15 topics
    ]
  }
}
```

3. **Update tests**

### Modifying Question Format

1. Update `TriviaQuestion` in `lib/types.ts`
2. Update `buildTriviaPrompt()` in `lib/server/ai/prompt-builder.ts`
3. Update all provider `parseTriviaResponse()` methods
4. Update `GameScreen.tsx` display logic
5. Update all tests using `TriviaQuestion`

---

## 🐛 DEBUGGING GUIDE

### Server-Side Issues

**Check logs:**
```bash
tail -f logs/quiziai.log  # Development only
```

**Log prefixes:**
- `[AI]` - AI service operations
- `[GAME]` - Game flow operations
- `[LOGGER]` - Logging system events

### Client-Side Issues

**Browser DevTools:**
- Console tab: Look for emoji-prefixed logs
  - `🎮 [GAME]` - Game flow
  - `🌍 [WIKI]` - Wikipedia fetch
  - `📄 [FALLBACK]` - Fallback data
- Network tab: Check API responses
- React DevTools: Inspect state/props

### Common Issues & Solutions

**Issue:** AI quota exceeded (429 errors)  
**Solution:** System auto-falls back to Groq → HuggingFace

**Issue:** Wikipedia 403 errors  
**Solution:** Client-side fetch avoids this (already implemented)

**Issue:** Timer not counting down  
**Solution:** Check `timerStartedRef` implementation in `GameScreen.tsx`

**Issue:** Questions repeating  
**Solution:** Verify `askedQuestions` is passed to AI service

**Issue:** Build fails in production  
**Solution:** Check logger isn't using `fs` operations (should check `NODE_ENV`)

---

## 📚 ARCHITECTURAL DECISIONS (WHY?)

### 1. Client-Side Wikipedia Fetch
**Why:** Server-side requests get blocked by Wikipedia (403 errors)  
**How:** Browser makes direct API calls with proper CORS

### 2. Server-Side AI Generation
**Why:** API keys must stay server-side (security)  
**How:** Next.js server actions ("use server" directive)

### 3. Queue-Based Batching
**Why:** Reduce AI API calls, avoid quota limits, improve UX  
**How:** Generate 10 questions at once, queue them, pre-fetch when low

### 4. Provider Abstraction
**Why:** Easy to add new AI providers, consistent prompts  
**How:** `AIProvider` interface + unified `buildTriviaPrompt()`

### 5. Question Deduplication
**Why:** Avoid repetitive questions in same session  
**How:** Track `askedQuestions[]`, pass to AI prompt

### 6. Category-Based Gameplay
**Why:** Better UX than manual input  
**How:** Selected category persists, random topic per question

---

## 🎯 DESIGN PHILOSOPHY

1. **Zero Cost:** Use only free tiers
2. **Resilience:** Multiple fallbacks for everything
3. **Mobile-First:** Optimize for mobile, desktop works
4. **Type Safety:** Strict TypeScript, no `any`
5. **Clean Code:** Modular, testable, documented
6. **User Experience:** Fast, responsive, clear feedback

---

## 📖 RELATED DOCUMENTATION

- `docs/ARCHITECTURE.md` - Full technical architecture
- `docs/PRODUCT_LOG.md` - Development history & decisions
- `docs/QUICK_REFERENCE.md` - Developer quick reference
- `docs/TEST_COVERAGE.md` - Test coverage details
- `README.md` - Setup & installation
- `docs/guides/` - Setup & troubleshooting guides

---

## 🚀 QUICK START FOR AI ASSISTANTS

**When starting a new task:**

1. **Read this file first** for context recovery
2. **Check relevant files** mentioned in task
3. **Understand current patterns** before suggesting changes
4. **Follow existing conventions** (structure, naming, styling)
5. **Don't refactor** unless explicitly requested
6. **Test changes** before considering done

**Key principles:**
- ✅ Preserve existing functionality
- ✅ Follow TypeScript strict mode
- ✅ Use existing patterns (no new approaches without discussion)
- ✅ Mobile-first, dark theme, thumb-friendly
- ✅ Comprehensive error handling
- ❌ No placeholders or incomplete code
- ❌ No invented APIs or methods
- ❌ No breaking changes without explicit approval

---

**Last Updated:** 2026-01-24  
**Maintained By:** Eric Bosch (Solo Developer)  
**Project Status:** Production-ready (v1.0.0-alpha)