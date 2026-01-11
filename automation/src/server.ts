import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { TestRunner, TestCase } from './testRunner';
import { LocatorManager } from './utils/locatorManager';
import { FailureCapture } from './utils/failureCapture';
import { HealerClient } from './utils/healerClient';
import { SpecRunner } from './utils/specRunner';
import type { TestExecution, FailurePayload, HealingResponse } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../test-results')));

// Initialize services
const testRunner = new TestRunner(process.env.HEALER_API_URL);
const locatorManager = new LocatorManager();
const failureCapture = new FailureCapture();
const healerClient = new HealerClient(process.env.HEALER_API_URL);
const specRunner = new SpecRunner(path.join(__dirname, '..'));

// Store active executions and their test case logic
const activeExecutions = new Map<string, TestExecution>();
const executionTestCases = new Map<string, TestCase[]>();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'automation-framework' });
});

/**
 * Get available test files - both locator files and spec files
 */
app.get('/api/tests/available', (req, res) => {
  try {
    const fsSync = require('fs');
    const testFiles: string[] = [];

    // Get spec files from tests directory
    const testsDir = path.join(__dirname, '../tests');
    if (fsSync.existsSync(testsDir)) {
      const specFiles = fsSync.readdirSync(testsDir)
        .filter((file: string) => file.endsWith('.spec.ts'))
        .map((file: string) => file.replace('.spec.ts', ''));
      testFiles.push(...specFiles);
    }

    // Also get locator files (for backward compatibility)
    const locatorsDir = path.join(__dirname, '../locators');
    if (fsSync.existsSync(locatorsDir)) {
      const locatorFiles = fsSync.readdirSync(locatorsDir)
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => file.replace('.json', ''));
      // Only add locator files that don't already exist as spec files
      locatorFiles.forEach((file: string) => {
        if (!testFiles.includes(file)) {
          testFiles.push(file);
        }
      });
    }

    res.json({ testFiles });
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
    const headlessMode = headless !== undefined ? headless : true;

    // Check if test files are spec files (they should have corresponding .spec.ts files)
    const fsSync = require('fs');
    const testsDir = path.join(__dirname, '../tests');
    const isSpecFile = (file: string) => {
      const fileName = file.endsWith('.spec.ts') ? file : `${file}.spec.ts`;
      return fsSync.existsSync(path.join(testsDir, fileName));
    };

    const specFiles = testFiles.filter(isSpecFile);
    
    if (specFiles.length > 0) {
      // Run spec files using SpecRunner
      const execution = await specRunner.runSpecFiles(specFiles, headlessMode);
      activeExecutions.set(execution.id, execution);
      res.json(execution);
    } else {
      // Fall back to legacy locator-based test execution (for backward compatibility)
      const testCasesToRun: TestCase[] = testFiles.map((testFile: string) => ({
        name: testFile,
        locatorFile: testFile,
        testFunction: async (page: any, locators: any) => {
          // Mock test function - replace with actual test logic
          throw new Error('Mock test - implement actual test cases');
        },
      }));

      const execution = await testRunner.runTests(testCasesToRun);
      activeExecutions.set(execution.id, execution);
      executionTestCases.set(execution.id, testCasesToRun);

      res.json(execution);
    }
  } catch (error: any) {
    console.error('Error executing tests:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get execution status
 */
app.get('/api/tests/execution/:id', (req, res) => {
  const { id } = req.params;
  const execution = testRunner.getExecution(id) || activeExecutions.get(id);

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
    const { payload } = req.body as { payload: FailurePayload };

    if (!payload) {
      return res.status(400).json({ error: 'Payload is required' });
    }

    const healingResponse = await healerClient.healSelector(payload);
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
    const testCases = executionTestCases.get(executionId);
    const testCase = testCases?.find(tc => tc.name === failedResult.testName);

    if (!testCase) {
      return res.status(404).json({ error: 'Test case logic not found for re-execution' });
    }

    // Perform healing and re-run
    const healedResult = await testRunner.healAndRerun(
      testCase,
      failedResult,
      selectedSelector,
      selectorType || 'css'
    );

    // Update the execution record
    const resultIndex = execution.results.findIndex(r => r.id === testId);
    if (resultIndex !== -1) {
      execution.results[resultIndex] = healedResult;
      
      // Update summary counts
      execution.passedTests = execution.results.filter(r => r.status === 'passed').length;
      execution.failedTests = execution.results.filter(r => r.status === 'failed').length;
      execution.healedTests = execution.results.filter(r => r.status === 'healed').length;
    }

    res.json({
      message: 'Test re-executed successfully',
      testId,
      result: healedResult,
      execution
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
  console.log(`Healer API URL: ${process.env.HEALER_API_URL || 'http://localhost:8000'}`);
});
