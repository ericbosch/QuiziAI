# Test Coverage Report

**Last Updated:** 2026-01-24

**Note:** Coverage numbers are from the last `npm run test:coverage` run. Re-run to refresh.

## Overall Coverage

| Metric | Coverage |
|--------|----------|
| **Statements** | 82.76% |
| **Branches** | 74.40% |
| **Functions** | 90.81% |
| **Lines** | 82.89% |

**Target:** 80% (met; main gap is `app/page.tsx` complexity, covered by E2E)

## Coverage by Module

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| `lib/server` | 88.07% | 75.86% | 93.75% | 89.65% |
| `lib/server/ai` | 98.36% | 92.85% | 100% | 98.30% |
| `lib/server/ai/providers` | 70.27% | 61.60% | 100% | 70.10% |
| `lib/client` | 91.22% | 64.51% | 100% | 90.74% |
| `components` | 79.08% | 82.41% | 86.95% | 79.33% |
| `app/page.tsx` | 84.25% | 77.19% | 86.48% | 84.31% |

## Test Suite

See `TEST_STATUS.md` for the latest test counts and pass/fail status.

## Coverage Analysis

### ✅ Well-Covered Modules
- **`lib/server/ai`** (98.36%): Core AI logic fully tested
- **`lib/server`** (88.07%): Server-side game logic well-tested
- **`components`** (79.08%): UI components well-tested

### ⚠️ Coverage Gaps
- **`app/page.tsx`** (84.25%): Complex component with:
  - Multiple state variables and refs
  - Async operations and error handling
  - Queue management logic
  - Timer interactions
  - User interaction flows
  
  **Note:** This component is covered by E2E tests (6 Playwright tests) which test the full user flow.

### 📝 Recommendations

1. **Core Business Logic:** Already well-tested (88%+ coverage)
2. **UI Component:** Complex state management makes unit testing challenging
3. **E2E Coverage:** Playwright tests cover critical user flows
4. **Acceptable Trade-off:** 82.76% unit coverage + E2E tests provides good confidence

## Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (requires: npx playwright install chromium)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Notes

- E2E tests use mock provider (`NEXT_PUBLIC_USE_MOCKS=true`) for consistent testing
- Jest excludes E2E tests via `testPathIgnorePatterns`
- All tests pass successfully
- Build and lint checks pass
