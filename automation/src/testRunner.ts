import { chromium, Browser, Page, BrowserContext, BrowserContextOptions } from '@playwright/test';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LocatorManager } from './utils/locatorManager';
import { FailureCapture } from './utils/failureCapture';
import { HealerClient } from './utils/healerClient';
import { AuthUtils } from './utils/authUtils';
import type { TestResult, TestExecution, FailurePayload } from './types';

export interface TestCase {
  name: string;
  locatorFile: string;
  userType?: string; // Added userType for session handling
  testFunction: (page: Page, locators: any) => Promise<void>;
}

export class TestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private locatorManager: LocatorManager;
  private failureCapture: FailureCapture;
  private healerClient: HealerClient;
  private executionResults: Map<string, TestExecution> = new Map();
  private currentUserType: string | null = null;

  constructor(
    healerApiUrl?: string
  ) {
    this.locatorManager = new LocatorManager();
    this.failureCapture = new FailureCapture();
    this.healerClient = new HealerClient(healerApiUrl);
  }

  /**
   * Initialize browser with optional userType for storage state
   */
  async initialize(userType?: string): Promise<void> {
    this.currentUserType = userType || null;
    const isHeadless = process.env.HEADLESS !== 'false';
    console.log(`Launching browser in ${isHeadless ? 'HEADLESS' : 'HEADED'} mode`);
    
    let statePath: string | undefined;

    // Handle session/storage state if userType is provided
    if (userType) {
      console.log(`Pre-launch initialization: Executing session flow for ${userType}...`);
      try {
        // This will execute the token and session generation flow
        statePath = await AuthUtils.getStorageState(userType);
        console.log(`Session state ready at: ${statePath}`);
      } catch (error) {
        console.error(`Error during session initialization for ${userType}:`, error);
        throw error; // Fail early if session cannot be created
      }
    }

    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: isHeadless,
      });
    }

    const contextOptions: BrowserContextOptions = {
      viewport: { width: 1920, height: 1080 },
      storageState: statePath, // Use the path we just generated/verified
    };

    console.log(statePath ? `Applying storage state for user: ${userType}` : 'No storage state applied.');
    this.context = await this.browser.newContext(contextOptions);
  }

  /**
   * Close browser and reset state
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {}
      this.context = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {}
      this.browser = null;
    }

    // After browser is closed, delete the session file if it was Salesforce
    if (this.currentUserType === 'CRMAdminQA') {
      console.log(`Cleaning up session file for ${this.currentUserType}...`);
      await AuthUtils.removeStorageState(this.currentUserType);
    }
    this.currentUserType = null;
  }

  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    // If context doesn't exist or we have a specific userType requirement, re-initialize
    if (!this.context || testCase.userType) {
      if (this.context) await this.context.close();
      await this.initialize(testCase.userType);
    }

    const testId = uuidv4();
    const startTime = new Date().toISOString();
    const page = await this.context!.newPage();

    try {
      // Load locators
      const locators = this.locatorManager.loadLocators(testCase.locatorFile);

      // Run test
      await testCase.testFunction(page, locators);

      return {
        id: testId,
        testName: testCase.name,
        status: 'passed',
        startTime,
        endTime: new Date().toISOString(),
      };
    } catch (error: any) {
      // Capture failure
      const errorMessage = error.message || String(error);
      
      // Try to extract locator key from error if possible
      const locatorKey = this.extractLocatorKey(errorMessage, testCase.locatorFile);
      
      // 1. Get selector from locator manager if key found
      let failedSelector = locatorKey 
        ? this.locatorManager.getLocator(testCase.locatorFile, locatorKey)?.selector || ''
        : '';

      // 2. If no key/selector found, try to extract actual selector from Playwright error
      if (!failedSelector) {
        const selectorMatch = errorMessage.match(/waiting for locator\(['"](.+?)['"]\)/i) || 
                              errorMessage.match(/locator\(['"](.+?)['"]\)/i);
        if (selectorMatch) {
          failedSelector = selectorMatch[1];
          console.log(`Extracted raw selector from error: ${failedSelector}`);
        }
      }

      // 3. Fallback: use the whole error message as context if still empty
      if (!failedSelector && errorMessage.length > 5) {
        if (errorMessage.includes('page.goto') || errorMessage.includes('timeout')) {
          failedSelector = 'Navigation Timeout (Page failed to load)';
        } else {
          console.warn('Could not identify specific failed selector. Using error snippet.');
          failedSelector = errorMessage.split('\n')[0].substring(0, 100);
        }
      }

      const payload = await this.failureCapture.captureFailure(
        page,
        failedSelector || 'Unknown Selector',
        errorMessage, // Use error message as "use of selector" for more context
        testCase.name,
        locatorKey || ''
      );

      return {
        id: testId,
        testName: testCase.name,
        status: 'failed',
        startTime,
        endTime: new Date().toISOString(),
        failure: {
          error: errorMessage,
          payload,
        },
        screenshot: payload.screenshot_path ? `/screenshots/${path.basename(payload.screenshot_path)}` : undefined,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Run multiple test cases
   */
  async runTests(testCases: TestCase[]): Promise<TestExecution> {
    const isHeadless = process.env.HEADLESS !== 'false';
    
    // If browser exists but mode changed, restart it
    if (this.browser) {
      // Note: This is a simple check. In a production environment, 
      // you might want to manage browser instances more carefully.
      await this.cleanup();
    }

    await this.initialize();

    const executionId = uuidv4();
    const startTime = new Date().toISOString();
    const results: TestResult[] = [];

    try {
      for (const testCase of testCases) {
        const result = await this.runTest(testCase);
        results.push(result);
      }

      const execution: TestExecution = {
        id: executionId,
        status: results.some(r => r.status === 'failed') ? 'failed' : 'completed',
        startTime,
        endTime: new Date().toISOString(),
        results,
        totalTests: testCases.length,
        passedTests: results.filter(r => r.status === 'passed').length,
        failedTests: results.filter(r => r.status === 'failed').length,
        healedTests: results.filter(r => r.status === 'healed').length,
      };

      this.executionResults.set(executionId, execution);
      return execution;
    } catch (error) {
      console.error('Error running tests:', error);
      throw error;
    } finally {
      // Always cleanup after batch execution
      await this.cleanup();
    }
  }

  /**
   * Heal a failed test by updating locator and re-running
   */
  async healAndRerun(
    testCase: TestCase,
    failedResult: TestResult,
    selectedSelector: string,
    selectorType: 'css' | 'xpath'
  ): Promise<TestResult> {
    if (!failedResult.failure?.payload?.failed_selector) {
      throw new Error('Cannot heal: failed selector not found in failure payload');
    }

    const oldSelector = failedResult.failure.payload.failed_selector;
    const locatorFile = testCase.locatorFile;

    // Update locator by value matching
    this.locatorManager.updateLocatorBySelector(locatorFile, oldSelector, selectedSelector, selectorType);

    // Wait for 3 seconds to ensure file system sync and give visual pause
    console.log('Waiting 3 seconds before re-executing test...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      // Re-run test
      const healedResult = await this.runTest(testCase);

      if (healedResult.status === 'passed') {
        healedResult.status = 'healed';
        // Store which locator was used for the pass
        healedResult.failure = {
          error: '',
          payload: failedResult.failure!.payload,
          healed: true,
          selectedLocator: selectedSelector
        };
      }

      return healedResult;
    } finally {
      // Cleanup after re-run
      await this.cleanup();
    }
  }

  /**
   * Get execution result by ID
   */
  getExecution(executionId: string): TestExecution | undefined {
    return this.executionResults.get(executionId);
  }

  /**
   * Extract locator key from error message (heuristic + explicit markers)
   */
  private extractLocatorKey(errorMessage: string, locatorFile: string): string | null {
    // 1. Check for explicit marker [LocatorKey:keyName]
    const markerMatch = errorMessage.match(/\[LocatorKey:(\w+)\]/);
    if (markerMatch) {
      console.log(`Found explicit locator key: ${markerMatch[1]}`);
      return markerMatch[1];
    }

    // 2. Fallback: Try to match keys from the locator file in the error message
    const locatorKeys = this.locatorManager.getLocatorKeys(locatorFile);
    
    for (const key of locatorKeys) {
      if (errorMessage.includes(`"${key}"`) || 
          errorMessage.includes(`'${key}'`) || 
          errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return key;
      }
    }

    return null;
  }
}
