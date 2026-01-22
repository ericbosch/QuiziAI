# QuiziAI Restructure Plan

**Status:** 📋 Planned (Post v0.1.0 Commit)  
**Priority:** Medium  
**Estimated Effort:** 2-3 hours  
**Risk Level:** Low (well-tested, incremental changes)

---

## 🎯 Objective

Restructure the codebase to follow modern Next.js 14+ App Router best practices, improving code organization, maintainability, and scalability while maintaining 100% functionality and test coverage.

---

## 📊 Current Structure Analysis

### Current State
```
QuiziAI/
├── app/                    # ✅ Good (Next.js convention)
├── components/             # ✅ Good (shared UI)
├── lib/                    # ⚠️ Mixed server/client code
│   ├── ai.ts              # Server-only
│   ├── game.ts            # Server-only
│   ├── logger.ts          # Server-only
│   ├── wikipedia-client.ts # Client-only
│   └── fallback-data.ts   # Client-only
├── constants/             # ✅ Good
├── __tests__/             # ✅ Good (mirrors structure)
├── docs/                  # ⚠️ Mixed with root-level docs
└── [root]/                # ⚠️ Scripts and guides scattered
    ├── *.md (guides)
    └── *.sh (scripts)
```

### Issues Identified
1. **Server/Client Mix:** `lib/` contains both server and client code without clear separation
2. **Documentation Scatter:** Setup guides mixed with root-level docs
3. **Scripts in Root:** Shell scripts not organized
4. **No Type Exports:** Shared types scattered across files
5. **Import Paths:** Could be more explicit about server/client boundaries

---

## 🏗️ Proposed Structure

### Target State
```
QuiziAI/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/                   # Shared UI components
│   └── GameScreen.tsx
│
├── lib/                          # Business logic (reorganized)
│   ├── server/                   # 🆕 Server-only code
│   │   ├── ai.ts                # AI service (moved from lib/)
│   │   ├── game.ts              # Server action (moved from lib/)
│   │   └── logger.ts            # Logger utility (moved from lib/)
│   ├── client/                   # 🆕 Client-only code
│   │   ├── wikipedia-client.ts  # Wikipedia fetch (moved from lib/)
│   │   └── fallback-data.ts     # Fallback data (moved from lib/)
│   └── types.ts                  # 🆕 Shared TypeScript types
│
├── constants/                     # Static data
│   └── topics.ts
│
├── scripts/                      # 🆕 Build/dev scripts
│   ├── ngrok-auth-setup.sh
│   ├── setup-ngrok.sh
│   └── start-mobile-test.sh
│
├── docs/                         # Documentation (reorganized)
│   ├── guides/                   # 🆕 Setup/troubleshooting guides
│   │   ├── WSL2_MOBILE_ACCESS.md
│   │   ├── NGROK_SETUP.md
│   │   ├── NGROK_TROUBLESHOOTING.md
│   │   ├── QUICK_START_NGROK.md
│   │   └── TROUBLESHOOTING.md
│   ├── ARCHITECTURE.md
│   ├── PRODUCT_LOG.md
│   ├── QUICK_REFERENCE.md
│   └── RESTRUCTURE_PLAN.md       # This file
│
├── __tests__/                    # Tests (mirror new structure)
│   ├── app/
│   ├── components/
│   ├── constants/
│   └── lib/
│       ├── server/               # 🆕 Server tests
│       │   ├── ai.test.ts
│       │   ├── game.test.ts
│       │   └── logger.test.ts
│       └── client/               # 🆕 Client tests
│           ├── wikipedia-client.test.ts
│           └── fallback-data.test.ts
│
└── [root]/                       # Config files only
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── jest.config.js
    ├── .env.local.example
    ├── README.md
    ├── CHANGELOG.md
    ├── TEST_STATUS.md
    └── COMMIT_README.md
```

---

## 📋 Migration Steps

### Phase 1: Create New Structure (No Breaking Changes)
1. ✅ Create `lib/server/` directory
2. ✅ Create `lib/client/` directory
3. ✅ Create `lib/types.ts` for shared types
4. ✅ Create `scripts/` directory
5. ✅ Create `docs/guides/` directory

### Phase 2: Move Files
1. **Server Code:**
   ```bash
   mv lib/ai.ts lib/server/ai.ts
   mv lib/game.ts lib/server/game.ts
   mv lib/logger.ts lib/server/logger.ts
   ```

2. **Client Code:**
   ```bash
   mv lib/wikipedia-client.ts lib/client/wikipedia-client.ts
   mv lib/fallback-data.ts lib/client/fallback-data.ts
   ```

3. **Scripts:**
   ```bash
   mv ngrok-auth-setup.sh scripts/
   mv setup-ngrok.sh scripts/
   mv start-mobile-test.sh scripts/
   ```

4. **Documentation:**
   ```bash
   mv WSL2_MOBILE_ACCESS.md docs/guides/
   mv NGROK_SETUP.md docs/guides/
   mv NGROK_TROUBLESHOOTING.md docs/guides/
   mv QUICK_START_NGROK.md docs/guides/
   mv TROUBLESHOOTING.md docs/guides/
   ```

5. **Tests:**
   ```bash
   mkdir -p __tests__/lib/server
   mkdir -p __tests__/lib/client
   mv __tests__/lib/ai.test.ts __tests__/lib/server/ai.test.ts
   mv __tests__/lib/game.test.ts __tests__/lib/server/game.test.ts
   mv __tests__/lib/logger.test.ts __tests__/lib/server/logger.test.ts
   mv __tests__/lib/wikipedia-client.test.ts __tests__/lib/client/wikipedia-client.test.ts
   mv __tests__/lib/fallback-data.test.ts __tests__/lib/client/fallback-data.test.ts
   ```

### Phase 3: Update Imports

#### 3.1 Update Server Code Imports
**Files to update:**
- `lib/server/game.ts` → Update `ai.ts` import
- `lib/server/ai.ts` → Update `logger.ts` import

**Changes:**
```typescript
// Before
import { createLogger } from "./logger";
import { generateTriviaFromContent } from "./ai";

// After
import { createLogger } from "./logger";  // Same directory, no change
import { generateTriviaFromContent } from "./ai";  // Same directory, no change
```

#### 3.2 Update Client Code Imports
**Files to update:**
- `app/page.tsx` → Update all lib imports
- `components/GameScreen.tsx` → Update type imports (if any)

**Changes:**
```typescript
// Before
import { generateTriviaFromContentServer } from "@/lib/game";
import { fetchWikipediaSummaryClient } from "@/lib/wikipedia-client";
import { fetchFallbackData } from "@/lib/fallback-data";
import { TriviaQuestion } from "@/lib/ai";

// After
import { generateTriviaFromContentServer } from "@/lib/server/game";
import { fetchWikipediaSummaryClient } from "@/lib/client/wikipedia-client";
import { fetchFallbackData } from "@/lib/client/fallback-data";
import { TriviaQuestion } from "@/lib/types";
```

#### 3.3 Extract Shared Types
**Create `lib/types.ts`:**
```typescript
// Export all shared types/interfaces
export type { TriviaQuestion } from "./server/ai";
export type { WikipediaSummary } from "./client/wikipedia-client";
// Add other shared types as needed
```

**Update `lib/server/ai.ts`:**
```typescript
// Export type for external use
export interface TriviaQuestion { ... }
```

#### 3.4 Update Test Imports
**Files to update:**
- All test files in `__tests__/lib/server/`
- All test files in `__tests__/lib/client/`
- `__tests__/app/page.test.tsx`
- `__tests__/app/page-gameflow.test.tsx`
- `__tests__/components/GameScreen.test.tsx`

**Changes:**
```typescript
// Before
import { generateTriviaFromContent } from "@/lib/ai";
import { fetchWikipediaSummaryClient } from "@/lib/wikipedia-client";

// After
import { generateTriviaFromContent } from "@/lib/server/ai";
import { fetchWikipediaSummaryClient } from "@/lib/client/wikipedia-client";
```

#### 3.5 Update Documentation References
**Files to update:**
- `README.md` → Update script paths and guide links
- `docs/ARCHITECTURE.md` → Update file paths
- `docs/QUICK_REFERENCE.md` → Update file map
- All guide files → Update cross-references

### Phase 4: Update Configuration

#### 4.1 Update `package.json` Scripts
```json
{
  "scripts": {
    "dev:tunnel": "echo '📱 Start ngrok in another terminal: ngrok http 3000' && next dev -H 0.0.0.0",
    "setup:ngrok": "bash scripts/setup-ngrok.sh",
    "mobile:test": "bash scripts/start-mobile-test.sh"
  }
}
```

#### 4.2 Update `tsconfig.json` (if needed)
Verify path aliases still work:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 4.3 Update `jest.config.js` (if needed)
Verify test path resolution still works.

### Phase 5: Verification & Testing

1. **Run TypeScript Check:**
   ```bash
   npm run build
   ```

2. **Run Linter:**
   ```bash
   npm run lint
   ```

3. **Run All Tests:**
   ```bash
   npm test
   ```

4. **Verify Test Coverage:**
   ```bash
   npm run test:coverage
   ```

5. **Manual Testing:**
   - Start dev server
   - Test category selection
   - Test manual topic input
   - Test game flow
   - Verify AI generation works
   - Check mobile access (if applicable)

---

## ✅ Checklist

### Pre-Migration
- [ ] Create backup branch: `git checkout -b backup/pre-restructure`
- [ ] Ensure all tests passing: `npm test`
- [ ] Ensure build works: `npm run build`
- [ ] Document current import paths (for reference)

### Migration
- [ ] Create new directory structure
- [ ] Move server files to `lib/server/`
- [ ] Move client files to `lib/client/`
- [ ] Move scripts to `scripts/`
- [ ] Move guides to `docs/guides/`
- [ ] Move test files to match new structure
- [ ] Create `lib/types.ts` and extract shared types
- [ ] Update all imports in source files
- [ ] Update all imports in test files
- [ ] Update documentation references
- [ ] Update `package.json` scripts (if needed)

### Post-Migration
- [ ] Run TypeScript check: `npm run build`
- [ ] Run linter: `npm run lint`
- [ ] Run all tests: `npm test`
- [ ] Verify test coverage: `npm run test:coverage`
- [ ] Manual testing (game flow)
- [ ] Update `ARCHITECTURE.md` with new structure
- [ ] Update `QUICK_REFERENCE.md` with new paths
- [ ] Update `README.md` with new script paths
- [ ] Commit changes with descriptive message

---

## 🔍 Files Requiring Import Updates

### Source Files
1. `app/page.tsx` - 4 imports to update
2. `lib/server/game.ts` - 1 import (ai.ts - same dir, no change)
3. `lib/server/ai.ts` - 1 import (logger.ts - same dir, no change)

### Test Files
1. `__tests__/app/page.test.tsx` - Mock imports
2. `__tests__/app/page-gameflow.test.tsx` - Mock imports
3. `__tests__/components/GameScreen.test.tsx` - Type imports (if any)
4. `__tests__/lib/server/ai.test.ts` - 1 import
5. `__tests__/lib/server/game.test.ts` - 1 import
6. `__tests__/lib/server/logger.test.ts` - No imports (likely)
7. `__tests__/lib/client/wikipedia-client.test.ts` - 1 import
8. `__tests__/lib/client/fallback-data.test.ts` - No imports (likely)

### Documentation Files
1. `README.md` - Script paths, guide links
2. `docs/ARCHITECTURE.md` - File paths throughout
3. `docs/QUICK_REFERENCE.md` - File map table
4. All guide files in `docs/guides/` - Cross-references

---

## 🎯 Benefits

### Immediate Benefits
1. **Clear Separation:** Server vs client code is explicit
2. **Better Organization:** Related files grouped logically
3. **Easier Navigation:** Developers know where to find code
4. **Scalability:** Structure supports growth

### Long-term Benefits
1. **Type Safety:** Centralized types prevent duplication
2. **Maintainability:** Clear boundaries reduce coupling
3. **Onboarding:** New developers understand structure faster
4. **Best Practices:** Aligns with Next.js 14+ conventions

---

## ⚠️ Risks & Mitigation

### Risk 1: Import Path Errors
- **Mitigation:** Update imports systematically, test after each phase
- **Rollback:** Git branch created before migration

### Risk 2: Test Failures
- **Mitigation:** Update test imports, verify all tests pass
- **Rollback:** Revert test file moves if needed

### Risk 3: Documentation Broken Links
- **Mitigation:** Update all docs, verify links work
- **Rollback:** Documentation changes are non-breaking

### Risk 4: Build/Type Errors
- **Mitigation:** Run `npm run build` after each phase
- **Rollback:** TypeScript will catch errors immediately

---

## 📝 Post-Migration Tasks

1. **Update Documentation:**
   - [ ] `ARCHITECTURE.md` - Update file structure diagram
   - [ ] `QUICK_REFERENCE.md` - Update file map
   - [ ] `README.md` - Update script references

2. **Update Product Log:**
   - [ ] Add entry for restructure completion
   - [ ] Update file paths in implementation details

3. **Git:**
   - [ ] Commit with message: `refactor: restructure codebase following Next.js 14+ best practices`
   - [ ] Tag if needed: `v0.1.1` (patch version)

---

## 🔗 Related Documentation

- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application/routing/colocating-files)
- `docs/ARCHITECTURE.md` - Current architecture (to be updated)
- `docs/QUICK_REFERENCE.md` - Quick reference (to be updated)

---

## 📅 Timeline

- **Estimated Time:** 2-3 hours
- **Best Time:** After v0.1.0 commit (stable baseline)
- **Dependencies:** None (can be done independently)

---

**Created:** 2026-01-22  
**Status:** 📋 Ready for implementation post v0.1.0  
**Owner:** Solo-Dev (CEO/CTO)
