import { test, expect, Page } from '@playwright/test';

test.describe('Login Test Suite', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
  });

  test('Login with valid credentials', async () => {
    // Navigate to login page
    await page.goto('https://support.ib-tradeapp.com/s/');

    // Handle cookie consent modal if it appears
    const cookieConsentModal = page.locator('c-cookie-consent');
    const cookieConsentVisible = await cookieConsentModal.isVisible().catch(() => false);
    if (cookieConsentVisible) {
      // Wait for cookie consent modal to be visible
      await expect(cookieConsentModal).toBeVisible({ timeout: 5000 });
      // Try to find and click accept button in cookie consent
      const acceptButton = page.locator('button:has-text("Accept"), button:has-text("OK"), button:has-text("I Agree")').first();
      const acceptButtonVisible = await acceptButton.isVisible().catch(() => false);
      if (acceptButtonVisible) {
        await acceptButton.click();
        // Wait for modal to disappear
        await expect(cookieConsentModal).toBeHidden({ timeout: 5000 });
      }
    }

    // Enter username
    const usernameInput = page.locator('input[name="Username"]');
    await expect(usernameInput).toBeVisible();
    await usernameInput.fill('milene.bronze@socrabine.pt.support');

    // Enter password
    const passwordInput = page.locator('input[name="Password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('Testownerptg@123');

    // Click login button
    const loginButton = page.locator('button:has-text("LOG IN")');
    await expect(loginButton).toBeVisible();
    await loginButton.click({ force: true });

    // Add a wait to see the result after login
    await page.waitForTimeout(2000);
  });
});