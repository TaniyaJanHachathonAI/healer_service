# API Integration Guide

This document outlines the architecture and API integration for the Selector Healer system.

## Current Status

The system is fully integrated. The frontend communicates with two backend services:
1.  **Python Healer Service** (Port 9001): Handles LLM analysis, semantic matching, and database storage for healed selectors.
2.  **Automation Server** (Port 3001): Handles Playwright test execution, failure capture, and locator management using `test-data/` folder.

## Architecture

```
Frontend (React) <---> Automation Server (Node.js) <---> Healer Service (Python)
                                |                              |
                                |                              |
                        Playwright Tests               SQLite Database
                        (test-data/ JSON)              (Heal History)
```

## Backend Service URLs

- **Healer Service (Python)**: `http://127.0.0.1:9001`
- **Automation Server (Node.js)**: `http://127.0.0.1:3001`

These can be configured via environment variables in a `.env` file:
```
VITE_API_BASE_URL=http://127.0.0.1:9001
VITE_AUTOMATION_API_URL=http://127.0.0.1:3001
```

## API Endpoints

### Automation Framework API (Port 3001)

1. **GET** `/api/tests/available`
   - Returns: `{ testFiles: string[] }`
   - Scans the `test-data/` directory for available test configurations.

2. **POST** `/api/tests/execute`
   - Body: `{ testFiles: string[], headless?: boolean }`
   - Executes specified tests using Playwright.

3. **GET** `/api/tests/execution/:id`
   - Returns: `TestExecution` details for a specific run.

4. **GET** `/api/failures/:testId`
   - Returns: `{ testResult: TestResult, payload: FailurePayload, executionId: string }`
   - Provides full context for a failed test step.

5. **POST** `/api/heal`
   - Body: `{ payload: FailurePayload, options: { full_coverage: boolean, selector_type: string, vision_enabled: boolean } }`
   - Forwards the request to the Python Healer Service and returns Top 5 CSS/XPath suggestions.

6. **POST** `/api/tests/heal-and-rerun`
   - Body: `{ executionId: string, testId: string, selectedSelector: string, selectorType: string }`
   - Updates the JSON locator file and re-runs the specific test case.

7. **GET** `/api/reports`
   - Returns a list of all historical execution reports stored on disk.

### Healer Service API (Port 9001)

1. **GET** `/health` - Service health and database status.
2. **GET** `/stats` - Global healing performance metrics.
3. **GET** `/history` - Paginated history of all successful healings.
4. **POST** `/feedback` - Submit user feedback for a specific healing.

## Data Types

All TypeScript types are defined in `src/types/index.ts`. Key types include:
- `TestExecution`: Overall status and summary of a test run.
- `TestResult`: Detailed result for an individual test case.
- `FailurePayload`: The data structure sent to the healer (HTML, screenshot path, semantic DOM).
- `HealingResponse`: The array of suggested selectors returned by the AI.

## Static Assets

- **Screenshots**: Served by the Automation Server at `http://127.0.0.1:3001/screenshots/:filename`.
- Screenshots are automatically captured on failure and stored in `automation/test-results/screenshots/`.
