# QuiziAI Quick Reference Card

**For:** Developers & AI assistants needing fast context recovery.

---

## 🎯 Core Concept

Mobile-first trivia PWA that generates questions on-the-fly:
1. User selects topic/category
2. Fetch content from Wikipedia (client-side)
3. Generate trivia with AI (server-side, multi-provider fallback)
4. Display question, handle answer, repeat

---

## 📂 File Map

| File | Purpose | Type |
|------|---------|------|
| `app/page.tsx` | Main game orchestrator, state management | Client |
| `components/GameScreen.tsx` | Game UI (timer, buttons, feedback) | Client |
| `lib/ai.ts` | AI service (Gemini → Groq → Hugging Face) | Server |
| `lib/game.ts` | Server action wrapper for AI | Server |
| `lib/wikipedia-client.ts` | Wikipedia fetch (client-side) | Client |
| `lib/fallback-data.ts` | Backup data sources | Client |
| `lib/logger.ts` | Server-side file logging | Server |
| `constants/topics.ts` | Curated topics by category | Data |

---

## 🔄 Data Flow (Simplified)

```
User Input → app/page.tsx
  ↓
Wikipedia Fetch (client) → wikipedia-client.ts
  ↓
AI Generation (server) → game.ts → ai.ts
  ↓
Display Question → GameScreen.tsx
  ↓
User Answer → Next Question (repeat)
```

---

## 🔑 Key State Variables

**In `app/page.tsx`:**
- `selectedCategory`: Current category (persists)
- `askedQuestions`: Array of question strings (deduplication)
- `currentTopic`: Active topic for current question
- `trivia`: Current question data
- `score`: `{ correct: number, total: number }`

---

## 🎨 UI Patterns

- **Mobile-first:** Portrait mode, thumb-friendly buttons
- **Dark theme:** Black background, white text
- **Timer:** 10-second countdown, auto-advance
- **Feedback:** Green (correct) / Red (incorrect) with fun fact

---

## 🔌 API Keys Required

**Minimum (at least one AI provider):**
- `GEMINI_API_KEY` (primary, may hit quota)
- `GROQ_API_KEY` (fast fallback)
- `HUGGINGFACE_API_KEY` (rate-limited fallback)

**No keys needed for:**
- Wikipedia (all variants)
- DuckDuckGo

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm test -- --coverage # With coverage
npm test -- --watch    # Watch mode
```

**Coverage:** 86.23% (Statements), 93/93 tests passing

---

## 🚀 Common Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # Lint check
npm run dev:tunnel    # Dev server + ngrok (mobile testing)
```

---

## 🐛 Debugging

**Server-side logs:**
```bash
tail -f logs/quiziai.log
```

**Client-side logs:**
- Browser DevTools Console
- Look for emoji-prefixed logs: `🎮 [GAME]`, `🤖 [AI]`, `🌐 [WIKI]`

---

## ⚠️ Common Issues

1. **State update delay:** Use `categoryOverride` parameter, not state
2. **CORS errors:** Use client-side fetching for Wikipedia
3. **API quota exceeded:** System auto-falls back to next provider
4. **Timer not counting:** Check `timerStartedRef` in `GameScreen.tsx`

---

## 📚 Documentation Files

- `docs/ARCHITECTURE.md` - Full architecture guide
- `docs/PRODUCT_LOG.md` - Development history
- `README.md` - Setup & installation
- `TEST_STATUS.md` - Test coverage details
- `WSL2_MOBILE_ACCESS.md` - WSL2 networking
- `QUICK_START_NGROK.md` - Ngrok setup

---

## 🎯 Key Design Decisions

1. **Client-side Wikipedia:** Avoids server-side blocking
2. **Server-side AI:** Keeps API keys secure
3. **Multi-provider fallback:** Handles quota limits
4. **Question deduplication:** Tracks `askedQuestions[]` in state
5. **Category persistence:** Selected category persists across questions

---

## 🔧 Quick Fixes

**Add new AI provider:**
1. Add `tryNewProviderAPI()` in `lib/ai.ts`
2. Add to fallback chain in `generateTriviaFromContent()`
3. Update `.env.local.example`
4. Add tests

**Add new category:**
1. Update `Category` type in `constants/topics.ts`
2. Add entry to `CATEGORIES` object
3. Add 15 topics
4. Update tests

**Modify question format:**
1. Update `TriviaQuestion` interface
2. Update `buildSystemPrompt()`
3. Update `parseTriviaResponse()`
4. Update `GameScreen.tsx`
5. Update tests

---

**Last Updated:** 2026-01-22
