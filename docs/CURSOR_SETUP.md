# Cursor AI Setup (QuiziAI)

**Purpose:** Standardize AI context and workflow for Cursor sessions.

---

## ✅ Required Context (Pin These)
- `docs/CURSOR_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/QUICK_REFERENCE.md`
- `.cursor/rules/00-core-behavior.mdc`

---

## 🔧 Session Setup Checklist
1. `git status -sb` to confirm branch + dirty files.
2. Read the task request and identify affected files.
3. Verify server/client boundaries:
   - `lib/server/*` = server-only
   - `lib/client/*` = client-only
   - `lib/shared/*` = safe for both
4. Confirm **Wikipedia-only** data sources (Spanish → English fallback).
5. Keep the game **Spanish** and docs/logs/commits **English**.
6. Update `TEST_STATUS.md` after running tests.

---

## 🌍 Language Policy
- **User-facing UI:** Spanish only.
- **Docs, logs, commit messages, code comments:** English.

---

## 🧠 Core Constraints (Non-Negotiable)
- AI generation via server actions only (`lib/server/game.ts`).
- Wikipedia fetch is client-side only.
- Queue-based batching (10 questions; prefetch at ≤2).
- Do not reintroduce `question-cache.ts`.
- Tailwind-only styling (no CSS modules or inline styles).

---

## 🧪 Test Guidance
- Unit tests: `npm test`
- Coverage: `npm run test:coverage` (updates `docs/TEST_COVERAGE.md`)
- E2E: `npm run test:e2e` (requires Playwright install)

---

## ▶️ Next Cursor Prompt Template

```
You are working on QuiziAI (Next.js 14, Spanish UI).
Read docs/CURSOR_CONTEXT.md and docs/ARCHITECTURE.md first.
Task: [describe the next change clearly]
Constraints:
- Wikipedia-only sources
- Server actions for AI (`lib/server/game.ts`)
- UI text in Spanish; docs/logs in English
Deliverables:
- Code changes
- Updated tests/docs (if needed)
- Summary + tests run
```
