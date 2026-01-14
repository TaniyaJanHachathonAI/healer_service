import { Page, expect } from '@playwright/test';

/**
 * Portal Login test suite converted from BDD framework
 */
export async function runPortalLoginTest(page: Page, locators: any) {
  const portalUrl = process.env.PRT_TRADEAPP_PORTAL_BASE_URL || 'https://support.ib-tradeapp.com/s/';
  
  console.log(`Navigating to TradeApp Portal: ${portalUrl}`);
  await page.goto(portalUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // 1. Handle Cookie Consent if visible
  const denyBtn = page.locator(locators.denyallbutton.selector);
  if (await denyBtn.isVisible()) {
    console.log('Clicking deny all on cookie consent...');
    await denyBtn.click();
  }

  // 2. Enter Credentials
  const username = process.env.TRADEAPP_PORTAL_USERNAME;
  const password = process.env.TRADEAPP_PORTAL_PASSWORD;

  if (!username || !password) {
    throw new Error('TRADEAPP_PORTAL_USERNAME or TRADEAPP_PORTAL_PASSWORD not found in environment.');
  }

  console.log(`Entering username: ${username}`);
  await page.fill(locators.username.selector, username);
  
  console.log('Entering password...');
  await page.fill(locators.password.selector, password);

  // 3. Click Login
  console.log('Clicking login button...');
  await page.click(locators.loginBtn.selector);

  // 4. Wait for redirection
  console.log('Waiting for post-login redirection...');
  await page.waitForTimeout(10000);
  

}

// Support for different export names to be more robust
export const test = runPortalLoginTest;
export default runPortalLoginTest;
