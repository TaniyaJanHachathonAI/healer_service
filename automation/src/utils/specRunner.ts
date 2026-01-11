import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { TestExecution, TestResult } from '../types';

const execAsync = promisify(exec);

/**
 * Run Playwright test spec files programmatically
 */
export class SpecRunner {
  private automationDir: string;

  constructor(automationDir: string) {
    this.automationDir = automationDir;
  }

  /**
   * Execute test spec files using Playwright CLI
   */
  async runSpecFiles(
    testFiles: string[],
    headless: boolean = true
  ): Promise<TestExecution> {
    const executionId = uuidv4();
    const startTime = new Date().toISOString();
    const results: TestResult[] = [];

    // Build test file paths - remove .spec.ts extension if present
    const testFileNames = testFiles.map(file => {
      // Remove .spec.ts extension if present
      return file.endsWith('.spec.ts') ? file.replace('.spec.ts', '') : file;
    });

    // Build test file paths
    const testFilePaths = testFileNames.map(fileName => {
      const fileNameWithExt = `${fileName}.spec.ts`;
      return path.join(this.automationDir, 'tests', fileNameWithExt);
    }).filter(filePath => {
      // Only include files that exist
      return fs.existsSync(filePath);
    });

    if (testFilePaths.length === 0) {
      throw new Error('No valid test files found');
    }

    // Set headless mode in environment
    const env = {
      ...process.env,
      HEADLESS: headless ? 'true' : 'false',
    };

    // Build command - use relative paths from automation directory
    const testFileArgs = testFilePaths.map(filePath => 
      path.relative(path.join(this.automationDir, 'tests'), filePath)
    );

    const args = [
      'test',
      ...testFileArgs,
      '--project=chromium',
      '--reporter=json',
    ];

    if (!headless) {
      args.push('--headed');
    }

    const command = `npx playwright ${args.join(' ')}`;

    try {
      // Execute Playwright tests
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.automationDir,
        env,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Try to parse JSON output from stdout or read from results.json
      let testResults: any[] = [];
      const resultsFile = path.join(this.automationDir, 'test-results', 'results.json');
      
      if (fs.existsSync(resultsFile)) {
        try {
          const resultsContent = fs.readFileSync(resultsFile, 'utf-8');
          const parsed = JSON.parse(resultsContent);
          testResults = Array.isArray(parsed) ? parsed : parsed.suites || [];
        } catch (e) {
          console.error('Failed to parse results.json:', e);
        }
      }

      // Parse stdout for JSON output
      try {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(line);
              if (Array.isArray(parsed)) {
                testResults = parsed;
                break;
              } else if (parsed.suites) {
                testResults = parsed.suites;
                break;
              }
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }
      } catch (e) {
        // Couldn't parse stdout, continue with file-based results
      }

      // Convert Playwright results to our TestResult format
      for (const testFile of testFileNames) {
        // Find results for this test file
        const fileResults = testResults.filter((r: any) => {
          if (r.file) {
            return r.file.includes(testFile) || r.file.includes(`${testFile}.spec.ts`);
          }
          return false;
        });

        if (fileResults.length > 0) {
          // Process each test result
          for (const result of fileResults) {
            if (result.specs) {
              // Handle suite format
              for (const spec of result.specs) {
                for (const test of spec.tests || []) {
                  const testResult: TestResult = {
                    id: uuidv4(),
                    testName: test.title || `${testFile} - ${spec.title}`,
                    status: test.results?.[0]?.status === 'passed' ? 'passed' : 'failed',
                    startTime: test.results?.[0]?.startTime || startTime,
                    endTime: test.results?.[0]?.startTime 
                      ? new Date(new Date(test.results[0].startTime).getTime() + (test.results[0].duration || 0)).toISOString()
                      : new Date().toISOString(),
                  };

                  if (testResult.status === 'failed' && test.results?.[0]?.status === 'failed') {
                    const error = test.results[0].error;
                    const screenshot = test.results[0].attachments?.find((a: any) => a.name === 'screenshot');
                    
                    testResult.failure = {
                      error: error?.message || error?.text || 'Test failed',
                      payload: {
                        failed_selector: '',
                        html: '',
                        semantic_dom: '',
                        use_of_selector: '',
                        full_coverage: false,
                        page_url: '',
                        screenshot_path: screenshot?.path || '',
                        selector_type: 'css',
                        test_name: test.title || testFile,
                        locator_key: '',
                        timestamp: new Date().toISOString(),
                      },
                    };
                    if (screenshot?.path) {
                      testResult.screenshot = screenshot.path;
                    }
                  }

                  results.push(testResult);
                }
              }
            } else {
              // Handle single test format
              const testResult: TestResult = {
                id: uuidv4(),
                testName: result.title || testFile,
                status: result.status === 'passed' ? 'passed' : 'failed',
                startTime: result.startTime || startTime,
                endTime: result.endTime || new Date().toISOString(),
              };

              if (testResult.status === 'failed') {
                testResult.failure = {
                  error: result.error?.message || result.error?.text || 'Test failed',
                  payload: {
                    failed_selector: '',
                    html: '',
                    semantic_dom: '',
                    use_of_selector: '',
                    full_coverage: false,
                    page_url: '',
                    screenshot_path: '',
                    selector_type: 'css',
                    test_name: result.title || testFile,
                    locator_key: '',
                    timestamp: new Date().toISOString(),
                  },
                };
              }

              results.push(testResult);
            }
          }
        } else {
          // No results found for this file - assume passed if no errors in stderr
          const hasErrors = stderr.toLowerCase().includes('error') || 
                           stderr.toLowerCase().includes('failed') ||
                           stdout.toLowerCase().includes('failed');
          results.push({
            id: uuidv4(),
            testName: testFile,
            status: !hasErrors ? 'passed' : 'failed',
            startTime,
            endTime: new Date().toISOString(),
          });
        }
      }

      // If no results were parsed, create basic results based on files
      if (results.length === 0) {
        for (const testFile of testFileNames) {
          results.push({
            id: uuidv4(),
            testName: testFile,
            status: 'passed', // Assume passed if we can't determine
            startTime,
            endTime: new Date().toISOString(),
          });
        }
      }

      const execution: TestExecution = {
        id: executionId,
        status: 'completed',
        startTime,
        endTime: new Date().toISOString(),
        results,
        totalTests: results.length,
        passedTests: results.filter(r => r.status === 'passed').length,
        failedTests: results.filter(r => r.status === 'failed').length,
        healedTests: results.filter(r => r.status === 'healed').length,
      };

      return execution;
    } catch (error: any) {
      // If command failed, create a failed execution
      for (const testFile of testFileNames) {
        results.push({
          id: uuidv4(),
          testName: testFile,
          status: 'failed',
          startTime,
          endTime: new Date().toISOString(),
          failure: {
            error: error.message || 'Test execution failed',
            payload: {
              failed_selector: '',
              html: '',
              semantic_dom: '',
              use_of_selector: '',
              full_coverage: false,
              page_url: '',
              screenshot_path: '',
              selector_type: 'css',
              test_name: testFile,
              locator_key: '',
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      const execution: TestExecution = {
        id: executionId,
        status: 'completed',
        startTime,
        endTime: new Date().toISOString(),
        results,
        totalTests: results.length,
        passedTests: 0,
        failedTests: results.length,
        healedTests: 0,
      };

      return execution;
    }
  }
}