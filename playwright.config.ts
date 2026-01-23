import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * Uses iPhone 13 viewport for mobile-first testing
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // iPhone 13 viewport
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        // iPhone 13 viewport settings (manually set to avoid webkit)
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_USE_MOCKS: 'true', // Use mocks for E2E tests
    },
  },
});
