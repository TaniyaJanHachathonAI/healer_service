import { Page, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
/**
 * Salesforce test suite converted from BDD framework
 */
export async function runSalesforceTest(page: Page, locators: any) {
  const accountName = "2026 JAN 09 - retailer store";
  const phone = "+212" + faker.string.numeric(9);

  console.log(`Starting Salesforce Contact Creation for: ${accountName}`);

  // 1. Navigate to Salesforce (using session URL from env)
  const startUrl = process.env.API_ACCESS_SESSION_CGC_QA || 'https://impbrands--rwibcgcqa.sandbox.lightning.force.com/one/one.app';
  console.log(`Navigating to: ${startUrl}`);
  
  // Use a more resilient waitUntil and longer timeout for Salesforce
  await page.goto(startUrl, { 
    waitUntil: 'domcontentloaded', 
    timeout: 60000 
  });
  
  // Wait for the app to actually load (Salesforce is heavy)
  await page.waitForLoadState('load', { timeout: 60000 });
  await page.waitForTimeout(5000);

  // 2. Create Contact flow
  await createContact(page, locators, phone, accountName);

  // 3. Invite Customer flow
  await inviteCustomerToPortalViaSms(page, locators, accountName);
}

async function createContact(page: Page, locators: any, phone: string, accountName: string) {
  // App Launcher
  const launcher = page.locator(locators.appLuncher.selector);
  await launcher.waitFor({ state: 'visible', timeout: 30000 });
  await launcher.click();
  await page.waitForTimeout(6000);
  
  // Search Accounts
  await page.click(locators.search.selector);
  await page.fill(locators.search.selector, "Accounts");
  
  // Click Accounts Tab
  await page.locator(locators.accountsTab.selector).nth(0).click();
  await page.waitForTimeout(5000);

  // Select Specific Account
  const accountSelector = locators.accountName.selector.replace("<<accountName>>", accountName);
  await page.locator(accountSelector).nth(0).click();
  
  // Manage Contact
  await page.locator(locators.contactManage.selector).waitFor({ state: 'visible' });
  await page.locator(locators.contactManage.selector).nth(0).click();
  await page.waitForTimeout(3000);

  // Registration flow
  await page.locator(locators.createRadio.selector).nth(0).click();
  await page.click(locators.nextBtn.selector);
  await page.waitForTimeout(3000);
  
  await page.locator(locators.createNewAccount.selector).nth(0).click();
  await page.click(locators.nextBtn.selector);
  
  // Owner Option
  await page.click(locators.optionOwner.selector);

  // Fill Details
  const randomSuffix = faker.string.alphanumeric(5);
  const lastName = `auto sec testing ${randomSuffix}`;
  const email = `testuser${randomSuffix}@example.com`;

  await page.fill(locators.lastName.selector, lastName);
  await page.fill(locators.CorrectPhoneNumber.selector, phone);
  await page.fill(locators.email.selector, email);
  
  await page.click(locators.nextBtn.selector);
  await page.waitForTimeout(10000);

  // Verify Success
  const success = page.locator(locators.successMsg.selector).first();
  await expect(success).toBeVisible({ timeout: 20000 });
  const content = await success.innerText();
  expect(content).toBe("Account Contact Relationship added Successfully");
  
  await page.locator(locators.finshBtn.selector).first().click();
}

async function inviteCustomerToPortalViaSms(page: Page, locators: any, contactName: string) {
  const contactTab = page.locator(locators.contactTab.selector).first();
  await expect(contactTab).toBeVisible({ timeout: 20000 });
  await contactTab.click();
  
  await page.waitForSelector(locators.recentlyViewedField.selector, { state: 'attached' });
  
  // Dynamic contact link matching
  const contactLink = page.locator(`//a[contains(., "${contactName}")]`).first();
  await contactLink.scrollIntoViewIfNeeded();
  await expect(contactLink).toBeVisible({ timeout: 20000 });
  await contactLink.click();
  
  await page.waitForSelector(locators.contactNameField.selector, { state: 'attached', timeout: 10000 });
  
  const invitation = page.locator(locators.invitePortal.selector).first();
  await invitation.click();

  await page.waitForSelector(locators.inviteCustomerViaSms.selector, { state: 'attached', timeout: 10000 });
  const inviteBtn = page.locator(locators.inviteCustomerViaSms.selector).first();
  await inviteBtn.click();

  await page.waitForSelector(locators.smsSentText.selector, { state: 'attached', timeout: 10000 });
  const smsSentText = page.locator(locators.smsSentText.selector).first();
  console.log(`SMS Status: ${await smsSentText.innerText()}`);
  
  await page.click(locators.finshBtnForSmsRegistration.selector);
}

// Support for different export names to be more robust
export const test = runSalesforceTest;
export default runSalesforceTest;
