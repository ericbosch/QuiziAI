# 🎯 QuiziAI Core Refinement Plan (v1.1.0)

**Objective:** Implement batch question loading, a dual-timer system, Spanish-localized visual feedback, and a robust E2E testing environment with mocks.

---

## 🛠️ Phase 1: Infrastructure & Mocks
1. **Production Logging Fix:**
   - Modify `lib/server/logger.ts` to disable all `fs` operations if `process.env.NODE_ENV === 'production'`. Use only `console.log`.
2. **Spanish Mock Provider:**
   - Create `lib/client/mock-provider.ts` with 10 Spanish trivia questions.
   - Implement toggle: If `process.env.NEXT_PUBLIC_USE_MOCKS === 'true'`, the AI service must return this mock batch immediately.

---

## 🧠 Phase 2: Game Logic (Batches & Timers)
1. **Batching System (10 Questions):**
   - Refactor `app/page.tsx` to handle a `questionsQueue`.
   - **Pre-fetch Logic:** When the user reaches question index 8 of the current batch, trigger a background request for the next batch of 10.
2. **Dual-Timer System:**
   - **Timer A (Decision):** 15-second countdown to answer. If 0: mark incorrect and show Fun Fact.
   - **Timer B (Transition):** 10-second countdown to read the Fun Fact and move next.

---

## 🎨 Phase 3: UI/UX (Spanish Interface)
1. **Segmented Progress Bar:**
   - In `components/GameScreen.tsx`, replace the continuous bar with 10 segments.
   - 
   - Colors: Gray (Pending), Green (Correct), Red (Incorrect/Timeout).
2. **Dynamic Spanish Loading State:**
   - Show a spinner and rotating messages every 2s during initial fetch.
   - Messages: "Consultando la Biblioteca de Alejandría...", "Interrogando a la IA sobre [Category]...", "Limpiando el polvo de los libros...", "Sincronizando neuronas artificiales...".

---

## 🧪 Phase 4: E2E Testing (Playwright)
1. **Setup:** Install `@playwright/test` and configure `playwright.config.ts` (iPhone 13 viewport).
2. **Critical Flow Test:** `__tests__/e2e/core-gameplay.spec.ts`. Verify: Load -> Correct Answer -> Timeout -> Pre-fetch trigger.

---

## ✅ Acceptance Criteria
- [x] `npm run build` succeeds.
- [x] 132 unit tests + 6 E2E tests pass (E2E tests require `npx playwright install chromium`).
- [x] UI/Content is exclusively in Spanish; Documentation/Logs in English.
- [x] Test coverage: 68.11% (target: 80% - main gap is `app/page.tsx` complex component)

## 📝 Implementation Notes
- **Playwright Setup**: Run `npx playwright install chromium` before running E2E tests.
- **Mock Provider**: Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` to use mock data.
- **Jest Config**: E2E tests are excluded from Jest via `testPathIgnorePatterns`.
- **Test Coverage**: Core business logic (`lib/server` at 88%, `lib/server/ai` at 98%) is well-tested. Main gap is UI component (`app/page.tsx` at 48%), which is covered by E2E tests.