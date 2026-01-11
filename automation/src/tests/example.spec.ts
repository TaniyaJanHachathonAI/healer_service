import { Page, expect } from '@playwright/test';

/**
 * Example test function that demonstrates how to use locators from a JSON file.
 * This function is dynamically loaded by the automation server.
 */
export async function runExampleTest(page: Page, locators: any) {
  console.log('Navigating to example.com...');
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  
  // 1. Success case: Logo should be visible
  console.log('Checking logo visibility...');
  const title = page.locator('h1');
  await expect(title).toBeVisible();
  
  // 2. Demonstration of how a failure would look
  // If we wanted to test healing for example.com, we would add a broken element here
  const key = 'logoMark'; // Just for demonstration
  const selector = locators[key]?.selector || 'h1';
  
  console.log(`Using locator "${key}" with selector: ${selector}`);
  
  try {
    await page.locator(selector).click({ timeout: 5000 });
  } catch (e: any) {
    e.message = `[LocatorKey:${key}] Failed to click element with selector "${selector}". Error: ${e.message}`;
    throw e;
  }
}

// Support for different export names to be more robust
export const test = runExampleTest;
export default runExampleTest;
export const runDemoTest = runExampleTest; // Also support this for compatibility
