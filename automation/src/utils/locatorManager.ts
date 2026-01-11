import * as fs from 'fs';
import * as path from 'path';
import type { LocatorData, LocatorsFile } from '../types';

export class LocatorManager {
  private locatorsPath: string;

  constructor(locatorsPath: string = path.join(__dirname, '../../test-data')) {
    this.locatorsPath = locatorsPath;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.locatorsPath)) {
      fs.mkdirSync(this.locatorsPath, { recursive: true });
    }
  }

  /**
   * Load locators from a JSON file
   */
  loadLocators(fileName: string): LocatorsFile {
    const filePath = path.join(this.locatorsPath, `${fileName}.json`);
    
    if (!fs.existsSync(filePath)) {
      // Create empty file if it doesn't exist
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
      return {};
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as LocatorsFile;
    } catch (error) {
      console.error(`Error loading locators from ${filePath}:`, error);
      return {};
    }
  }

  /**
   * Save locators to a JSON file
   */
  saveLocators(fileName: string, locators: LocatorsFile): void {
    const filePath = path.join(this.locatorsPath, `${fileName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(locators, null, 2), 'utf-8');
  }

  /**
   * Get a specific locator by key
   */
  getLocator(fileName: string, key: string): LocatorData | null {
    const locators = this.loadLocators(fileName);
    return locators[key] || null;
  }

  /**
   * Update a locator by matching its old selector value
   */
  updateLocatorBySelector(
    fileName: string,
    oldSelector: string,
    newSelector: string,
    newType: 'css' | 'xpath' = 'css'
  ): void {
    const locators = this.loadLocators(fileName);
    let found = false;

    console.log(`Searching for old selector: "${oldSelector}" in ${fileName}.json`);

    for (const key in locators) {
      if (locators[key].selector === oldSelector) {
        locators[key].selector = newSelector;
        locators[key].selectorType = newType;
        found = true;
        console.log(`Updated locator key "${key}" in ${fileName}.json (matched by selector value)`);
        break;
      }
    }

    if (!found) {
      console.warn(`No exact match for selector "${oldSelector}" in ${fileName}.json`);
      // Fallback: if there's only one entry in the file and it's a test file with 1 element, update it anyway?
      // No, let's be strict but informative.
      throw new Error(`Could not find locator with value "${oldSelector}" in ${fileName}.json to update.`);
    }

    this.saveLocators(fileName, locators);
  }

  /**
   * Update a specific locator
   */
  updateLocator(
    fileName: string,
    key: string,
    selector: string,
    selectorType: 'css' | 'xpath' = 'css'
  ): void {
    const locators = this.loadLocators(fileName);
    
    if (!locators[key]) {
      throw new Error(`Locator key "${key}" not found in ${fileName}.json`);
    }

    locators[key] = {
      ...locators[key],
      selector,
      selectorType: (selectorType as 'css' | 'xpath'),
    };

    this.saveLocators(fileName, locators);
    console.log(`Updated locator "${key}" in ${fileName}.json`);
  }

  /**
   * Add a new locator
   */
  addLocator(
    fileName: string,
    key: string,
    selector: string,
    selectorType: 'css' | 'xpath' = 'css',
    description?: string,
    useCase?: string
  ): void {
    const locators = this.loadLocators(fileName);
    
    locators[key] = {
      key,
      selector,
      selectorType,
      description,
      useCase,
    };

    this.saveLocators(fileName, locators);
  }

  /**
   * Get all locator keys from a file
   */
  getLocatorKeys(fileName: string): string[] {
    const locators = this.loadLocators(fileName);
    return Object.keys(locators);
  }
}
