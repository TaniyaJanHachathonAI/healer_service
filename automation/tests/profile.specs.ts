import { test, expect, Locator, Page } from '@playwright/test';

test.describe('My Profile - User Settings', () => {
  let page: Page;

  // Selectors
  const selectors = {
    profileIcon: '.slds-avatar_x-small.slds-m-top_xxx-small',
    myProfileOption: 'div > ul > li:nth-child(1) > a > span',
    myProfilePageTitle: '.H130-Regular-Lowercase.brand-color',
    deactivateBtn: 'div.slds-large-size_1-of-3 button.slds-button',
    username: 'div[class="slds-size_1-of-1 slds-m-top_xx-small"] span',
    password: 'span[part="formatted-rich-text"]:has-text("Palavra-passe")',
    languageLabel: 'label[class="slds-form-element__label"]',
    email: 'label[class="slds-form-element__label slds-no-flex"]',
    userNameDisplay: '.slds-m-top_medium.username-color-text a',
    languageDropdown: 'button.slds-combobox__input',
    saveBtn: 'div[class="slds-col"] button',
    myAccountHeader: '.H130-Regular-Lowercase.brand-color',
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Assumes user is already logged in
    // If login is required, do it here
    await page.goto('https://support.ib-tradeapp.com/s/');
  });

  test('Verify My Profile details and language change', async () => {
    /** Step 1: Check Person icon */
    const profileIcon = page.locator(selectors.profileIcon);
    await expect(profileIcon).toBeVisible();

    /** Step 2: Navigate to My Profile */
    await profileIcon.click();
    const myProfileOption = page.locator(selectors.myProfileOption);
    await expect(myProfileOption).toBeVisible();
    await myProfileOption.click();

    await page.waitForLoadState('networkidle');

    const currentURL = page.url();
    expect(currentURL).toContain('settings');

    await expect(page).toHaveTitle(/User Settings/);

    /** Step 3: Verify fields presence */
    const fields: Record<string, Locator> = {
      username: page.locator(selectors.username),
      email: page.locator(selectors.email),
      password: page.locator(selectors.password),
      language: page.locator(selectors.languageLabel).nth(0),
      location: page.locator(selectors.languageLabel).nth(1),
      timezone: page.locator(selectors.languageLabel).nth(2),
      'deactivate account': page.locator(selectors.deactivateBtn),
    };

    for (const [name, locator] of Object.entries(fields)) {
      await expect(locator, `${name} is not visible`).toBeVisible();
    }

    const usernameDisplay = page.locator(selectors.userNameDisplay);
    await expect(usernameDisplay).toBeVisible();

    const isEditable = await usernameDisplay.evaluate(
      el => el.tagName.toLowerCase() === 'input'
    );
    expect(isEditable).toBeFalsy();

    /** Step 4: Change language and revert */
    const dropdown = page.locator(selectors.languageDropdown).first();
    await expect(dropdown).toBeVisible();

    const originalLanguage = (await dropdown.textContent())?.trim();
    if (!originalLanguage) throw new Error('Original language not found');

    const originalHeader = (await page.locator(selectors.myAccountHeader).textContent())?.trim();
    if (!originalHeader) throw new Error('Original header not found');

    let targetLanguage: string;
    let expectedHeader: string;

    if (originalLanguage === 'Greek') {
      targetLanguage = 'Portuguese (European) (PT)';
      expectedHeader = 'Meu perfil';
    } else {
      targetLanguage = 'Greek';
      expectedHeader = 'Ο λογαριασμός μου';
    }

    // Change language
    await dropdown.click();
    await page.locator(`span[title="${targetLanguage}"]`).click();
    await page.locator(selectors.saveBtn).click();

    await expect(page.locator(selectors.myAccountHeader)).toHaveText(expectedHeader);

    // Revert language
    await dropdown.click();
    await page.locator(`span[title="${originalLanguage}"]`).click();
    await page.locator(selectors.saveBtn).click();

    await expect(page.locator(selectors.myAccountHeader)).toHaveText(originalHeader);
  });
});
