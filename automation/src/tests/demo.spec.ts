import { Page, expect } from '@playwright/test';

export async function runDemoTest(page: Page, locators: any) {
  // Go to a public site for demo
  console.log('Navigating to playwright.dev...');
  await page.goto('https://playwright.dev/', { waitUntil: 'domcontentloaded' });
  
  // 1. Logo check using JSON locator
  const logoKey = 'logoMark';
  const logoSelector = locators[logoKey]?.selector || '.navbar__logo';
  console.log(`Checking logo visibility using "${logoKey}" (${logoSelector})...`);
  
  try {
    const logo = page.locator(logoSelector);
    await expect(logo).toBeVisible({ timeout: 5000 });
    console.log('Logo is visible!');
  } catch (e: any) {
    console.warn(`Logo check failed for "${logoKey}". This might be expected if the site changed.`);
    e.message = `[LocatorKey:${logoKey}] Logo not visible with selector "${logoSelector}". ${e.message}`;
    throw e;
  }
  
  // 2. Healing case: Attempt to click the broken element
  const key = 'brokenElement';
  const selector = locators[key]?.selector || '.non-existent-fallback';
  
  console.log(`Attempting to click "${key}" with selector: ${selector}`);
  
  try {
    // We use a shorter timeout for the demo so healing happens faster
    await page.locator(selector).click({ timeout: 5000 });
    console.log('Successfully clicked the element!');
  } catch (e: any) {
    // CRITICAL: We enrich the error message with the locator key 
    // so our framework can identify which JSON key needs to be healed.
    e.message = `[LocatorKey:${key}] Failed to click element with selector "${selector}". Error: ${e.message}`;
    console.error('Test failed as expected, triggering healing flow...');
    throw e;
  }
}

// Support for different export names to be more robust
export const test = runDemoTest;
export default runDemoTest;
