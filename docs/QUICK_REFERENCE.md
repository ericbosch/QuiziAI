# QuiziAI Quick Reference

**Purpose:** Fast commands and shortcuts for developers.  
**For context recovery:** See `docs/CURSOR_CONTEXT.md`

---

## 🚀 Development Commands

```bash
# Development
npm run dev              # Local dev server (localhost:3000)
npm run dev:network      # Network-accessible dev server
npm run dev:tunnel       # Dev server + ngrok tunnel (mobile)

# Build & Deploy
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint issues

# Testing
npm test                 # Run all unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:integration:ai # Live AI provider smoke tests (requires keys)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # E2E with UI debugger

# Mock Testing
NEXT_PUBLIC_USE_MOCKS=true npm run dev  # Use mock provider
```

---

## ⌨️ Cursor Shortcuts

```bash
⌘I (Ctrl+I)         # Open Agent (main tool)
⌘L (Ctrl+L)         # Open Ask mode (read-only)
⌘K (Ctrl+K)         # Inline edit
⌘T (Ctrl+T)         # New Agent tab
⌘Shift+L            # New chat (fresh context)
Ctrl+Enter          # Reference codebase in chat

@filename           # Attach file to context
@folder/            # Attach folder
@docs/              # Attach documentation
@codebase           # Broad codebase search
```

---

## 📁 Critical File Locations

```
lib/server/ai/index.ts          # AI orchestrator (fallback chain)
lib/server/ai/prompt-builder.ts # Unified prompt builder
lib/server/game.ts              # Server action (batch generation)
lib/client/wikipedia-client.ts  # Wikipedia fetch
app/page.tsx                    # Main game logic
components/GameScreen.tsx       # Game UI
constants/topics.ts             # Categories & topics
```

---

## 🔧 Quick Fixes

### Add New AI Provider
1. Create `lib/server/ai/providers/newprovider.ts`
2. Implement `AIProvider` interface
3. Add to `providers` array in `lib/server/ai/index.ts`
4. Add API key to `.env.local.example`
5. Add tests

### Add New Category
1. Update `Category` type in `constants/topics.ts`
2. Add entry to `CATEGORIES` object (15 topics)
3. Update tests in `__tests__/constants/topics.test.ts`

### Fix State Issues
- Use refs for async operations
- Use `categoryOverride` parameter (not state)
- Clean up timers in `useEffect` return

### Debug Production Build
```bash
npm run build           # Check for errors
npm run start          # Test production locally
tail -f logs/quiziai.log  # Check server logs (dev only)
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| AI quota exceeded | Auto-falls back to Groq → HuggingFace |
| Wikipedia 403 | Already fixed (client-side fetch) |
| Timer not counting | Check `timerStartedRef` in GameScreen |
| Questions repeat | Verify `askedQuestions` passed to AI |
| Build fails | Check logger `NODE_ENV` check |

---

## 🔍 Debugging

**Server logs (dev only):**
```bash
tail -f logs/quiziai.log
```

**Browser console prefixes:**
- `🎮 [GAME]` - Game flow
- `🌍 [WIKI]` - Wikipedia operations
- `📄 [FALLBACK]` - Fallback data sources
- `🤖 [AI]` - AI generation

**Network tab:**
- Check API responses for errors
- Verify Wikipedia fetch success
- Check AI provider responses

---

## 📊 Test Coverage Targets

| Module | Target | Current |
|--------|--------|---------|
| `lib/server/ai` | 95%+ | 98.36% ✅ |
| `lib/server` | 85%+ | 88.07% ✅ |
| `components` | 80%+ | 79.73% ✅ |
| `lib/client` | 75%+ | 74.28% ⚠️ |
| Overall | 80%+ | 68.11% ⚠️ |

**Note:** `app/page.tsx` (48%) is covered by E2E tests.

---

## 🔗 Documentation

- `docs/CURSOR_CONTEXT.md` - **AI context reset guide**
- `docs/ARCHITECTURE.md` - Full technical architecture
- `docs/PRODUCT_LOG.md` - Development history
- `README.md` - Setup & installation
- `docs/guides/` - Setup & troubleshooting

---

**Last Updated:** 2026-01-24  
**Version:** 1.0.0-alpha