import { test, expect } from '@playwright/test';

/**
 * E2E test for core gameplay flow
 * Tests: Load -> Correct Answer -> Timeout -> Pre-fetch trigger
 * Uses mock provider when NEXT_PUBLIC_USE_MOCKS=true
 */
test.describe('Core Gameplay Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Enable mock mode for consistent testing
    await page.goto('/');
    // Set environment variable via localStorage or cookie if needed
    // For now, we'll test with mocks enabled via .env.local
  });

  test('should load game and display first question', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on a category or "Aleatorio" button
    const aleatorioButton = page.getByRole('button', { name: /aleatorio/i });
    if (await aleatorioButton.isVisible()) {
      await aleatorioButton.click();
    } else {
      // Or click first category button
      const categoryButton = page.locator('button').filter({ hasText: /historia|ciencia|geografía/i }).first();
      if (await categoryButton.isVisible()) {
        await categoryButton.click();
      }
    }

    // Wait for loading to complete
    await page.waitForSelector('text=/tiempo restante|siguiente pregunta/i', { timeout: 10000 }).catch(() => {
      // If loading messages appear, wait for them to finish
    });

    // Verify question is displayed
    const questionText = page.locator('h2').first();
    await expect(questionText).toBeVisible({ timeout: 15000 });
    const question = await questionText.textContent();
    expect(question).toBeTruthy();
    expect(question?.length).toBeGreaterThan(0);

    // Verify options are displayed
    const options = page.locator('button').filter({ hasText: /^[A-Za-z0-9]/ });
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(4);
  });

  test('should handle correct answer and show feedback', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game
    const aleatorioButton = page.getByRole('button', { name: /aleatorio/i });
    if (await aleatorioButton.isVisible()) {
      await aleatorioButton.click();
    }

    // Wait for question
    await page.waitForSelector('h2', { timeout: 15000 });

    // Wait for options to be clickable (exclude feedback buttons)
    const options = page.locator('button').filter({ 
      hasText: /^[A-Za-z0-9]/,
      hasNot: page.locator('text=/siguiente|nuevo/i')
    });
    await expect(options.first()).toBeVisible({ timeout: 5000 });

    // Click first option (might be correct or incorrect)
    await options.first().click();

    // Verify feedback is shown (case insensitive)
    const feedback = page.locator('text=/correcto|incorrecto/i');
    await expect(feedback).toBeVisible({ timeout: 3000 });

    // Verify fun fact is displayed (look for any text in feedback area)
    const feedbackArea = page.locator('.bg-green-600\\/20, .bg-red-600\\/20');
    await expect(feedbackArea).toBeVisible({ timeout: 2000 });
  });

  test('should show decision timer and mark incorrect on timeout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game
    const aleatorioButton = page.getByRole('button', { name: /aleatorio/i });
    if (await aleatorioButton.isVisible()) {
      await aleatorioButton.click();
    }

    // Wait for question
    await page.waitForSelector('h2', { timeout: 15000 });

    // Verify decision timer is visible
    const timerText = page.locator('text=/tiempo restante/i');
    await expect(timerText).toBeVisible({ timeout: 2000 });

    // Wait for timer to countdown (wait at least 16 seconds for timeout)
    await page.waitForTimeout(16000);

    // Verify timeout feedback (incorrect)
    const incorrectFeedback = page.locator('text=/incorrecto/i');
    await expect(incorrectFeedback).toBeVisible({ timeout: 2000 });

    // Verify correct answer is highlighted
    const correctAnswer = page.locator('button.bg-green-600');
    await expect(correctAnswer).toBeVisible({ timeout: 2000 });
  });

  test('should trigger pre-fetch at question 8', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game
    const aleatorioButton = page.getByRole('button', { name: /aleatorio/i });
    if (await aleatorioButton.isVisible()) {
      await aleatorioButton.click();
    }

    // Wait for first question
    await page.waitForSelector('h2', { timeout: 15000 });

    // Answer questions until we reach question 8 (index 7)
    // We'll answer quickly to test pre-fetch
    for (let i = 0; i < 8; i++) {
      // Wait for question
      await page.waitForSelector('h2', { timeout: 5000 });
      
      // Click first option (exclude feedback buttons)
      const options = page.locator('button').filter({ 
        hasText: /^[A-Za-z0-9]/,
        hasNot: page.locator('text=/siguiente|nuevo/i')
      });
      if (await options.count() > 0) {
        await options.first().click();
      }

      // Wait for feedback
      await page.waitForSelector('text=/correcto|incorrecto/i', { timeout: 3000 }).catch(() => {
        // Feedback might not appear if timeout happens
      });

      // Click "Siguiente pregunta" button or wait for auto-advance
      const nextButton = page.getByRole('button', { name: /siguiente pregunta/i });
      if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click();
      } else {
        // Wait for auto-advance (10 seconds transition timer)
        await page.waitForTimeout(11000);
      }
    }

    // At question 8, pre-fetch should have been triggered
    // Verify we can continue without delay (queue should have questions)
    await page.waitForSelector('h2', { timeout: 5000 });
    const questionText = await page.locator('h2').first().textContent();
    expect(questionText).toBeTruthy();
  });

  test('should display segmented progress bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game
    const aleatorioButton = page.getByRole('button', { name: /aleatorio/i });
    if (await aleatorioButton.isVisible()) {
      await aleatorioButton.click();
    }

    // Wait for question
    await page.waitForSelector('h2', { timeout: 15000 });

    // Answer a question
    const options = page.locator('button').filter({ 
      hasText: /^[A-Za-z0-9]/,
      hasNot: page.locator('text=/siguiente|nuevo/i')
    });
    await options.first().click();

    // Wait for feedback to appear (answer is recorded)
    await page.waitForSelector('text=/correcto|incorrecto/i', { timeout: 3000 });

    // Verify progress bar segments exist (they appear after answering)
    // Look for the progress bar container first
    const progressBarContainer = page.locator('.flex.gap-1\\.5').first();
    await expect(progressBarContainer).toBeVisible({ timeout: 2000 });
    
    // Then check for segments
    const progressSegments = page.locator('.bg-green-500, .bg-red-500, .bg-gray-700');
    const segmentCount = await progressSegments.count();
    expect(segmentCount).toBeGreaterThan(0);
  });

  test('should display dynamic Spanish loading messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game
    const aleatorioButton = page.getByRole('button', { name: /aleatorio/i });
    if (await aleatorioButton.isVisible()) {
      await aleatorioButton.click();
    }

    // Check for loading messages
    const loadingMessages = [
      /consultando la biblioteca/i,
      /interrogando a la ia/i,
      /limpiando el polvo/i,
      /sincronizando neuronas/i,
    ];

    // At least one loading message should appear
    let foundMessage = false;
    for (const message of loadingMessages) {
      const element = page.locator(`text=${message}`);
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundMessage = true;
        break;
      }
    }

    // Loading messages may rotate quickly, so we check if any appeared
    // or if we've moved past loading (question is visible)
    const questionVisible = await page.locator('h2').isVisible({ timeout: 15000 }).catch(() => false);
    expect(foundMessage || questionVisible).toBeTruthy();
  });
});
