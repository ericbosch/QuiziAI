# Test Coverage Report

**Last Updated:** 2026-01-23

## Overall Coverage

| Metric | Coverage |
|--------|----------|
| **Statements** | 68.11% |
| **Branches** | 66.88% |
| **Functions** | 67.59% |
| **Lines** | 68.53% |

**Target:** 80% (not reached - main gap is `app/page.tsx` complex component)

## Coverage by Module

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| `lib/server` | 88.07% | 75.86% | 93.75% | 89.65% |
| `lib/server/ai` | 98.36% | 92.85% | 100% | 98.30% |
| `lib/server/ai/providers` | 70.27% | 61.60% | 100% | 70.10% |
| `lib/client` | 74.28% | 57.14% | 23.07% | 73.13% |
| `components` | 79.73% | 80.21% | 91.30% | 80.00% |
| `app/page.tsx` | 48.36% | 51.75% | 42.10% | 49.30% |

## Test Suite

- **Unit Tests:** 132 tests passing
- **E2E Tests:** 6 tests passing (Playwright)
- **Total:** 138 tests
- **Test Files:** 18 files

## Coverage Analysis

### ✅ Well-Covered Modules
- **`lib/server/ai`** (98.36%): Core AI logic fully tested
- **`lib/server`** (88.07%): Server-side game logic well-tested
- **`components`** (79.73%): UI components well-tested

### ⚠️ Coverage Gaps
- **`app/page.tsx`** (48.36%): Complex component with:
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
4. **Acceptable Trade-off:** 68% unit coverage + E2E tests provides good confidence

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
