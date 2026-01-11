# Automation Framework

Playwright-based self-healing test automation framework with JSON locator management.

## Features

- 🎭 **Playwright Integration** - Modern browser automation
- 📝 **JSON Locator Management** - Store and update selectors dynamically
- 🔧 **Self-Healing** - Integrate with healer service to fix broken selectors
- 📸 **Failure Capture** - Automatic screenshots, HTML, and semantic DOM extraction
- 📊 **Test Reporting** - Comprehensive test execution tracking
- 🔄 **Auto Re-execution** - Update locators and re-run tests automatically

## Installation

```bash
npm install
```

## Configuration

Set environment variables:

```bash
HEALER_API_URL=http://localhost:8000  # Healer service API URL
PORT=3001                              # Automation framework server port
HEADLESS=true                          # Run browser in headless mode
```

## Project Structure

```
automation/
├── src/
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility classes
│   │   ├── locatorManager.ts    # JSON locator management
│   │   ├── failureCapture.ts    # Failure data capture
│   │   └── healerClient.ts      # Healer API client
│   ├── testRunner.ts       # Test execution engine
│   └── server.ts           # Express API server
├── tests/                  # Playwright test files
├── locators/               # JSON locator files
│   └── example.json
├── test-results/           # Test results, screenshots, failures
├── playwright.config.ts
└── package.json
```

## Usage

### 1. Define Locators

Create JSON files in `locators/` directory:

```json
{
  "logoMark": {
    "key": "logoMark",
    "selector": "#logo",
    "selectorType": "css",
    "description": "Main logo element",
    "useCase": "Click on logomark wrapper"
  }
}
```

### 2. Write Tests

Create test files in `tests/` directory using Playwright:

```typescript
import { test, expect } from '@playwright/test';
import { LocatorManager } from '../src/utils/locatorManager';

const locatorManager = new LocatorManager();

test('My test', async ({ page }) => {
  const locators = locatorManager.loadLocators('example');
  await page.goto('https://example.com');
  
  const logo = page.locator(locators.logoMark.selector);
  await logo.click();
});
```

### 3. Run Tests

#### Run via Playwright CLI:
```bash
npm test
```

#### Start API Server (for frontend integration):
```bash
npm run dev
# or
npm start
```

### 4. Integration with Frontend

The automation framework exposes a REST API that the frontend can use:

- `POST /api/tests/execute` - Execute tests
- `GET /api/tests/execution/:id` - Get execution status
- `GET /api/failures/:testId` - Get failure details
- `POST /api/heal` - Heal selector via healer API
- `POST /api/tests/heal-and-rerun` - Update locator and re-run test

## Failure Payload Structure

When a test fails, the framework captures:

```json
{
  "failed_selector": "card__logomark__wrapper12as3aas",
  "html": "<full page HTML>",
  "semantic_dom": "<processed DOM data>",
  "use_of_selector": "click on logomark wrapper",
  "full_coverage": true,
  "page_url": "https://example.com",
  "screenshot_path": "/path/to/screenshot.png",
  "selector_type": "css",
  "test_name": "Test name",
  "locator_key": "logoMark",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Healing Workflow

1. Test fails → Failure captured
2. Frontend displays failure → User clicks "Heal Locator"
3. Frontend calls `/api/heal` → Gets top 5 CSS + top 5 XPath selectors
4. User selects locator → Frontend calls `/api/tests/heal-and-rerun`
5. Framework updates locator in JSON → Re-runs test
6. Test passes → Marked as healed

## API Endpoints

### POST /api/tests/execute
Execute test cases.

**Request:**
```json
{
  "testFiles": ["example"],
  "testCases": []
}
```

**Response:**
```json
{
  "id": "execution-id",
  "status": "completed",
  "startTime": "2024-01-01T00:00:00.000Z",
  "results": [...],
  "totalTests": 5,
  "passedTests": 3,
  "failedTests": 2,
  "healedTests": 0
}
```

### GET /api/tests/execution/:id
Get execution status and results.

### GET /api/failures/:testId
Get failure details and payload.

### POST /api/heal
Heal selector using healer service.

**Request:**
```json
{
  "payload": { /* FailurePayload */ }
}
```

**Response:**
```json
{
  "css_selectors": [...],
  "xpath_selectors": [...],
  "auto_selected": {
    "css": "...",
    "xpath": "..."
  }
}
```

### POST /api/tests/heal-and-rerun
Update locator and re-run test.

**Request:**
```json
{
  "executionId": "...",
  "testId": "...",
  "selectedSelector": "...",
  "selectorType": "css"
}
```

## License

MIT
