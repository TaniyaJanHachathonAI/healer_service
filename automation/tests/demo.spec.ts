import { Page } from '@playwright/test';

export async function runDemoTest(page: Page, locators: any) {
  // Go to a public site for demo
  await page.goto('https://playwright.dev/');
  
  // Use a correct locator
  await page.waitForSelector('text=Get started');
  
  // Use a broken locator to trigger healing
  console.log('Attempting to click broken element to trigger healing demo...');
  const brokenSelector = locators.brokenElement.selector;
  await page.click(brokenSelector, { timeout: 5000 });
}
