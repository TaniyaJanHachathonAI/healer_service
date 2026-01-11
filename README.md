# Healer Service - End-to-End Self-Healing Test Automation System

Complete self-healing test automation system with Playwright, integrated frontend dashboard, and healer service.

## Architecture Overview

This system consists of three main components:

1. **Frontend Dashboard** - React-based UI for test execution and healing
2. **Automation Framework** - Playwright + TypeScript test automation with `test-data/` JSON locator management
3. **Healer Service** - AI-powered selector healing API (separate repo)

## Features

### Frontend Dashboard
- 🎨 **Modern UI** - Clean, professional design with responsive layout
- 🎭 **Test Execution** - Execute Playwright tests from UI
- 📸 **Failure Visualization** - View screenshots, HTML, and failure details
- 🔧 **Self-Healing UI** - Heal selectors with top 5 CSS + XPath suggestions
- 📊 **Test Results** - View execution status and results
- 🔄 **Auto Re-execution** - Update locators and re-run tests

### Automation Framework
- 🎭 **Playwright Integration** - Modern browser automation
- 📝 **JSON Locator Management** - Store and update selectors dynamically in `test-data/`
- 🔧 **Self-Healing** - Integrate with healer service to fix broken selectors
- 📸 **Failure Capture** - Automatic screenshots, HTML, and semantic DOM extraction
- 📊 **Test Reporting** - Comprehensive test execution tracking
- 🔄 **Auto Re-execution** - Update locators and re-run tests automatically

### Healer Service (Separate Repo)
- **Smart Selector Healing** - CSS & XPath generation with LLM-powered intelligence
- **Screenshot Analysis** - Vision model integration for enhanced accuracy
- **Stability & Semantic Scoring** - Ranks selectors by resistance to UI changes
- **Cost Optimization** - 76% reduction in LLM token usage

## Quick Start

### Prerequisites
- Node.js 16+
- Backend Healer API running (default: http://localhost:8000)

### 1. Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 2. Automation Framework

```bash
cd automation
npm install
npm run dev  # Starts API server on port 3001
```

Set environment variables:
```bash
HEALER_API_URL=http://localhost:8000
PORT=3001
HEADLESS=true
```

### 3. Healer Service

See healer service repository for setup instructions.

## Project Structure

```
healer_service/
├── frontend/              # React frontend dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TestExecution.tsx
│   │   │   ├── TestFailure.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   └── package.json
├── automation/            # Playwright automation framework
│   ├── src/
│   │   ├── utils/
│   │   │   ├── locatorManager.ts
│   │   │   ├── failureCapture.ts
│   │   │   └── healerClient.ts
│   │   ├── testRunner.ts
│   │   └── server.ts
│   ├── tests/             # Playwright test files
│   ├── test-data/         # JSON locator files (new)
│   └── package.json
└── README.md
```

## Workflow

### 1. Test Execution Flow

1. **From Frontend**: Click "Test Execution" → Select test files → Click "Execute Tests"
2. **Automation Framework**: Runs Playwright tests using JSON locators from `test-data/`
3. **On Failure**: Captures screenshot, HTML, semantic DOM, and creates failure payload
4. **Frontend**: Displays failed tests with details

### 2. Healing Flow

1. **View Failure**: Click "View Details" on a failed test
2. **Heal Selector**: Click "Heal Selector" button
3. **Get Suggestions**: Frontend calls automation API → Calls healer service → Returns top 5 CSS + top 5 XPath
4. **Select Locator**: User selects the best locator from suggestions (Manual or Recommended)
5. **Update & Re-run**: Click "Update Locator & Re-execute Test"
6. **Framework**: Updates locator in JSON file (`test-data/`) → Re-runs test
7. **Result**: Test passes → Marked as healed

## Failure Payload Structure

When a test fails, the automation framework captures:

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

## API Endpoints

### Automation Framework API (Port 3001)

- `GET /api/tests/available` - Get available test files from `test-data/`
- `POST /api/tests/execute` - Execute tests
- `GET /api/tests/execution/:id` - Get execution status
- `GET /api/failures/:testId` - Get failure details
- `POST /api/heal` - Heal selector via healer service
- `POST /api/tests/heal-and-rerun` - Update locator in `test-data/` and re-run test

### Healer Service API (Port 9001)

- `POST /heal` - Single selector healing
- `POST /heal-failure` - Heal from failure payload (returns top 5 CSS + XPath)
- `GET /history` - Get healing history
- `GET /stats` - Get statistics
- `POST /feedback` - Submit feedback
- `GET /health` - Health check

## Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://127.0.0.1:9001
VITE_AUTOMATION_API_URL=http://127.0.0.1:3001
```

### Automation Framework
```bash
HEALER_API_URL=http://127.0.0.1:9001
PORT=3001
HEADLESS=true
```

## Development

### Running All Services

1. Start Healer Service (port 9001)
2. Start Automation Framework: `cd automation && npm run dev`
3. Start Frontend: `cd frontend && npm run dev`

### Creating Tests

1. Create locator JSON file in `automation/test-data/`
2. Create test file in `automation/tests/`
3. Use `LocatorManager` to load locators
4. Tests will automatically capture failures

### Example Locator File

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

## License

MIT
