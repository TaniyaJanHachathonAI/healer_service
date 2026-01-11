import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import { TestRunner, TestCase } from './testRunner';
import { LocatorManager } from './utils/locatorManager';
import { FailureCapture } from './utils/failureCapture';
import { HealerClient } from './utils/healerClient';
import type { TestExecution, FailurePayload, HealingResponse } from './types';

const app = express();
const PORT = process.env.PORT || 3001;
const REPORTS_DIR = path.join(__dirname, '../test-results/reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../test-results')));

// Initialize services
const testRunner = new TestRunner(process.env.HEALER_API_URL);
const locatorManager = new LocatorManager();
const failureCapture = new FailureCapture();
const healerClient = new HealerClient(process.env.HEALER_API_URL);

// Store active executions and their test case logic
const activeExecutions = new Map<string, TestExecution>();
const executionTestCases = new Map<string, TestCase[]>();

/**
 * Helper to save report to disk
 */
const saveReport = (execution: TestExecution) => {
  const filePath = path.join(REPORTS_DIR, `${execution.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(execution, null, 2));
};

/**
 * Helper to load report from disk
 */
const loadReport = (id: string): TestExecution | null => {
  const filePath = path.join(REPORTS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
};

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'automation-framework' });
});

/**
 * Get available test files/locator files
 */
app.get('/api/tests/available', (req, res) => {
  try {
    const locatorsDir = path.join(__dirname, '../test-data');
    const fs = require('fs').promises;
    const fsSync = require('fs');
    
    if (!fsSync.existsSync(locatorsDir)) {
      return res.json({ testFiles: [] });
    }

    const files = fsSync.readdirSync(locatorsDir)
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => file.replace('.json', ''));

    res.json({ testFiles: files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Execute tests
 */
app.post('/api/tests/execute', async (req, res) => {
  try {
    const { testFiles, testCases, headless } = req.body;

    if (!testFiles || !Array.isArray(testFiles)) {
      return res.status(400).json({ error: 'testFiles array is required' });
    }

    // Set headless mode if provided
    if (headless !== undefined) {
      process.env.HEADLESS = headless ? 'true' : 'false';
    }

    // Load actual test case functions if available
    const testCasesToRun: TestCase[] = testFiles.map((testFile: string) => {
      const baseCase: TestCase = {
        name: `Test: ${testFile}`,
        locatorFile: testFile,
        testFunction: async (page: any, locators: any) => {
          try {
            // Find the spec file in src/tests
            const testDir = path.join(__dirname, 'tests');
            const possibleFiles = [`${testFile}.spec.ts`, `${testFile}.test.ts`, `${testFile}.ts`];
            let actualFile = '';
            
            for (const f of possibleFiles) {
              if (fs.existsSync(path.join(testDir, f))) {
                actualFile = f;
                break;
              }
            }

            if (!actualFile) {
              throw new Error(`Test logic file for "${testFile}" not found in ${testDir}`);
            }

            // Import using absolute path for reliability with tsx
            const testPath = path.join(testDir, actualFile);
            const testModule = await import(testPath);
            const testFn = testModule.runDemoTest || testModule.runExampleTest || testModule.default || testModule.test;
            
            if (testFn) {
              console.log(`Running dynamic test logic from ${actualFile}...`);
              await testFn(page, locators);
            } else {
              throw new Error(`No exported test function found in ${actualFile}. Export 'runDemoTest', 'runExampleTest', 'test', or use a default export.`);
            }
          } catch (e: any) {
            console.error(`Dynamic test execution failed for "${testFile}":`, e.message);
            throw e;
          }
        },
      };
      return baseCase;
    });

    const execution = await testRunner.runTests(testCasesToRun);
    activeExecutions.set(execution.id, execution);
    executionTestCases.set(execution.id, testCasesToRun);
    saveReport(execution);

    // Provide dynamic logging of the payload passed to the healer
    console.log('Execution completed. Metadata captured:', {
      totalTests: execution.totalTests,
      failedTests: execution.failedTests,
      reportPath: path.join(REPORTS_DIR, `${execution.id}.json`)
    });

    res.json(execution);
  } catch (error: any) {
    console.error('Error executing tests:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all reports
 */
app.get('/api/reports', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(file => file.endsWith('.json'));
    
    const reports = files.map(file => {
      const content = fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8');
      const execution = JSON.parse(content) as TestExecution;
      return {
        id: execution.id,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        totalTests: execution.totalTests,
        passedTests: execution.passedTests,
        failedTests: execution.failedTests,
        healedTests: execution.healedTests
      };
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get execution status
 */
app.get('/api/tests/execution/:id', (req, res) => {
  const { id } = req.params;
  const execution = activeExecutions.get(id) || loadReport(id);

  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }

  res.json(execution);
});

/**
 * Get failure payload
 */
app.get('/api/failures/:testId', (req, res) => {
  const { testId } = req.params;
  const execution = Array.from(activeExecutions.values())
    .find(e => e.results.some(r => r.id === testId));

  if (!execution) {
    return res.status(404).json({ error: 'Test result not found' });
  }

  const result = execution.results.find(r => r.id === testId);
  if (!result || !result.failure) {
    return res.status(404).json({ error: 'Failure not found' });
  }

  res.json({
    testResult: result,
    payload: result.failure.payload,
    executionId: execution.id, // Include executionId for heal-and-rerun
  });
});

/**
 * Heal a selector using healer API
 */
app.post('/api/heal', async (req, res) => {
  try {
    const { payload, options } = req.body as { payload: FailurePayload, options?: any };

    if (!payload) {
      return res.status(400).json({ error: 'Payload is required' });
    }

    console.log(`Sending healing request to Python Service for selector: ${payload.failed_selector}`);
    const rawResponse = await healerClient.healSelector(payload, options || {});
    
    console.log('Raw response from Python Healer:', JSON.stringify(rawResponse).substring(0, 500) + '...');

    // Transform Python service response to UI expected format
    // Alignment with healer_service-main/main.py:build_custom_heal_response
    const candidates = rawResponse.candidates || [];
    
    if (candidates.length === 0) {
      console.warn('No healing candidates returned from Python service.');
    }

    const css_selectors = candidates.map((c: any, index: number) => ({
      RankIndex: index + 1,
      Score: c.score || 0,
      BaseSim: c.base_score || 0,
      AttrScore: c.attribute_score || 0,
      Tag: c.tag || '',
      Text: c.text || '',
      Role: c.role || '', // Added role if available
      'Suggested Selector': c.selector || '',
      XPath: c.xpath || '',
    }));

    const healingResponse: HealingResponse = {
      css_selectors: css_selectors,
      xpath_selectors: css_selectors.filter((c: any) => c.XPath).map((c: any) => ({
        ...c,
        'Suggested Selector': c.XPath 
      })),
      auto_selected: {
        css: rawResponse.chosen || (css_selectors[0] ? css_selectors[0]['Suggested Selector'] : undefined),
        xpath: css_selectors.find((c: any) => c.XPath)?.XPath || undefined
      }
    };

    console.log(`Transformed response sent to UI: ${css_selectors.length} CSS, ${healingResponse.xpath_selectors.length} XPath selectors`);
    res.json(healingResponse);
  } catch (error: any) {
    console.error('Error healing selector:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update locator and re-execute test
 */
app.post('/api/tests/heal-and-rerun', async (req, res) => {
  try {
    const { executionId, testId, selectedSelector, selectorType } = req.body;

    if (!executionId || !testId || !selectedSelector) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const execution = activeExecutions.get(executionId);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    const failedResult = execution.results.find(r => r.id === testId);
    if (!failedResult || !failedResult.failure) {
      return res.status(404).json({ error: 'Failed test result not found' });
    }

    // Get the test case logic
    let testCases = executionTestCases.get(executionId);
    
    // If not in memory (server restart), try to reconstruct from report on disk
    if (!testCases) {
      const savedExecution = loadReport(executionId.replace(/^re-/, '')); // strip re- prefix if any
      if (savedExecution) {
        console.log(`Reconstructing test cases for execution ${executionId} from saved report`);
        const reconstructedCases: TestCase[] = savedExecution.results.map(r => ({
          name: r.testName,
          locatorFile: r.testName.replace('Test: ', ''),
          testFunction: async (page: any, locators: any) => {
            const testFile = r.testName.replace('Test: ', '');
            const testDir = path.join(__dirname, 'tests');
            const possibleFiles = [`${testFile}.spec.ts`, `${testFile}.test.ts`, `${testFile}.ts`];
            let actualFile = '';
            
            for (const f of possibleFiles) {
              if (fs.existsSync(path.join(testDir, f))) {
                actualFile = f;
                break;
              }
            }

            if (!actualFile) {
              throw new Error(`Test logic file for "${testFile}" not found. Please ensure it exists in ${testDir}`);
            }

            const testPath = path.join(testDir, actualFile);
            const testModule = await import(testPath);
            const testFn = testModule.runDemoTest || testModule.runExampleTest || testModule.default || testModule.test;
            
            if (testFn) {
              await testFn(page, locators);
            } else {
              throw new Error(`No exported test function found in ${actualFile}.`);
            }
          }
        }));
        executionTestCases.set(executionId, reconstructedCases);
        testCases = reconstructedCases;
      }
    }

    const testCase = testCases?.find(tc => tc.name === failedResult.testName);

    if (!testCase) {
      return res.status(404).json({ error: 'Test case logic not found for re-execution' });
    }

    console.log(`Re-executing test "${failedResult.testName}" with healed locator: "${selectedSelector}" (${selectorType})`);

    // Perform healing and re-run
    const healedResult = await testRunner.healAndRerun(
      testCase,
      failedResult,
      selectedSelector,
      selectorType || 'css'
    );

    console.log(`Re-execution completed. Status: ${healedResult.status}`);

    // Create a new execution session for the re-run to keep history
    const reExecution: TestExecution = {
      ...execution,
      id: `re-${Date.now()}-${execution.id}`,
      startTime: new Date().toISOString(),
      results: execution.results.map(r => r.id === testId ? healedResult : r),
    };

    // Update counts
    reExecution.passedTests = reExecution.results.filter(r => r.status === 'passed').length;
    reExecution.failedTests = reExecution.results.filter(r => r.status === 'failed').length;
    reExecution.healedTests = reExecution.results.filter(r => r.status === 'healed').length;
    reExecution.status = reExecution.failedTests > 0 ? 'failed' : 'completed';
    reExecution.endTime = new Date().toISOString();

    activeExecutions.set(reExecution.id, reExecution);
    executionTestCases.set(reExecution.id, testCases || []); // Link test logic to new ID
    saveReport(reExecution);

    res.json({
      message: 'Test re-executed successfully',
      testId,
      result: healedResult,
      execution: reExecution
    });
  } catch (error: any) {
    console.error('Error in heal-and-rerun:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Serve screenshots
 */
// Serve screenshots
app.get('/screenshots/:filename', (req, res) => {
  const { filename } = req.params;
  const screenshotPath = path.join(__dirname, '../test-results/screenshots', filename);
  res.sendFile(screenshotPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Screenshot not found' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Automation Framework Server running on http://localhost:${PORT}`);
  console.log(`Healer API URL: ${process.env.HEALER_API_URL || 'http://localhost:9001'}`);
});
