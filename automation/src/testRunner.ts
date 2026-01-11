import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LocatorManager } from './utils/locatorManager';
import { FailureCapture } from './utils/failureCapture';
import { HealerClient } from './utils/healerClient';
import type { TestResult, TestExecution, FailurePayload } from './types';

export interface TestCase {
  name: string;
  locatorFile: string;
  testFunction: (page: Page, locators: any) => Promise<void>;
}

export class TestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private locatorManager: LocatorManager;
  private failureCapture: FailureCapture;
  private healerClient: HealerClient;
  private executionResults: Map<string, TestExecution> = new Map();

  constructor(
    healerApiUrl?: string
  ) {
    this.locatorManager = new LocatorManager();
    this.failureCapture = new FailureCapture();
    this.healerClient = new HealerClient(healerApiUrl);
  }

  /**
   * Initialize browser
   */
  async initialize(): Promise<void> {
    const isHeadless = process.env.HEADLESS !== 'false';
    console.log(`Launching browser in ${isHeadless ? 'HEADLESS' : 'HEADED'} mode`);
    
    this.browser = await chromium.launch({
      headless: isHeadless,
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
  }

  /**
   * Close browser
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    if (!this.context) {
      await this.initialize();
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
      const failedSelector = locatorKey 
        ? this.locatorManager.getLocator(testCase.locatorFile, locatorKey)?.selector || ''
        : '';

      const payload = await this.failureCapture.captureFailure(
        page,
        failedSelector,
        testCase.name,
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
        screenshot: payload.screenshot_path,
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
        status: 'completed',
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
    if (!failedResult.failure?.payload?.locator_key) {
      throw new Error('Cannot heal: locator key not found in failure payload');
    }

    const locatorKey = failedResult.failure.payload.locator_key;
    const locatorFile = testCase.locatorFile;

    // Update locator
    this.locatorManager.updateLocator(locatorFile, locatorKey, selectedSelector, selectorType);

    // Re-run test
    const healedResult = await this.runTest(testCase);

    if (healedResult.status === 'passed') {
      healedResult.status = 'healed';
    }

    return healedResult;
  }

  /**
   * Get execution result by ID
   */
  getExecution(executionId: string): TestExecution | undefined {
    return this.executionResults.get(executionId);
  }

  /**
   * Extract locator key from error message (heuristic)
   */
  private extractLocatorKey(errorMessage: string, locatorFile: string): string | null {
    // Try to match common Playwright error patterns
    // This is a simple heuristic - can be improved
    const locatorKeys = this.locatorManager.getLocatorKeys(locatorFile);
    
    for (const key of locatorKeys) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return key;
      }
    }

    return null;
  }
}
