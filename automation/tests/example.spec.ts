import { test, expect, Page } from '@playwright/test';
import { LocatorManager } from '../src/utils/locatorManager';
import { FailureCapture } from '../src/utils/failureCapture';

// Example test file - this shows how to structure your tests
const locatorManager = new LocatorManager();
const failureCapture = new FailureCapture();

test.describe('Example Test Suite', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
  });

  test('Example test with locators', async () => {
    // Load locators
    const locators = locatorManager.loadLocators('example');

    // Navigate to page
    await page.goto('https://example.com');

    // Use locator
    const logoElement = page.locator(locators.logoMark.selector);
    await expect(logoElement).toBeVisible();

    // Perform action
    await logoElement.click();
  });

  test('Example test that might fail', async () => {
    const locators = locatorManager.loadLocators('example');
    
    await page.goto('https://example.com');

    try {
      const submitButton = page.locator(locators.submitButton.selector);
      await submitButton.click({ timeout: 5000 });
    } catch (error: any) {
      // Capture failure
      await failureCapture.captureFailure(
        page,
        locators.submitButton.selector,
        'Click submit button',
        'Example test that might fail',
        'submitButton'
      );
      throw error;
    }
  });
});
