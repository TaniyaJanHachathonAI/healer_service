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
    const logo = page.locator(logoSelector).nth(0);
    await expect(logo).toBeVisible({ timeout: 5000 });
    console.log('Logo is visible!');
  } catch (e: any) {
    console.warn(`Logo check failed for "${logoKey}". This might be expected if the site changed.`);
    // Note: No explicit marker needed anymore as we match by selector value!
    throw e;
  }
  
  // // 2. Healing case: Attempt to click the broken element
  // const key = 'brokenElement';
  // const selector = locators[key]?.selector || '.non-existent-fallback';
  
  // console.log(`Attempting to click using selector: ${selector}`);
  
  // try {
  //   // We use a shorter timeout for the demo so healing happens faster
  //   await page.locator(selector).click({ timeout: 5000 });
  //   console.log('Successfully clicked the element!');
  // } catch (e: any) {
  //   console.error('Test failed, triggering healing flow...');
  //   throw e;
  // }
}

// Support for different export names to be more robust
export const test = runDemoTest;
export default runDemoTest;
