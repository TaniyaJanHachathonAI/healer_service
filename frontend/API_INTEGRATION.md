# API Integration Guide

This document outlines how to integrate the actual backend API when it's ready.

## Current Status

The frontend is currently using **mock data** for demonstration purposes. All API calls are stubbed with mock implementations in `src/services/mockData.ts`.

## Files to Update

### 1. `src/services/api.ts`

All automation-related API methods have TODO comments indicating where to add the actual API calls. Currently, they use mock data:

- `getAvailableTests()` - Line ~70
- `executeTests()` - Line ~79
- `getExecution()` - Line ~95
- `getFailure()` - Line ~105
- `healFailure()` - Line ~125
- `healAndRerun()` - Line ~140

### 2. Mock Data File

The mock data is in `src/services/mockData.ts`. You can:
- Keep it for testing/development
- Remove it when production API is ready
- Use it as reference for expected data structures

## Integration Steps

### Step 1: Update API Base URLs

In `src/services/api.ts`, ensure the automation API URL is correct:

```typescript
const AUTOMATION_API_URL = import.meta.env.VITE_AUTOMATION_API_URL || 'http://localhost:3001';
```

Set environment variable in `.env`:
```
VITE_AUTOMATION_API_URL=http://localhost:3001
```

### Step 2: Replace Mock Implementations

For each method in `api.ts`, replace the mock implementation with the actual API call:

**Before (Mock):**
```typescript
getAvailableTests: async (): Promise<{ testFiles: string[] }> => {
  const { mockTestFiles, mockDelay } = await import('./mockData');
  await mockDelay(500);
  return { testFiles: mockTestFiles };
},
```

**After (Real API):**
```typescript
getAvailableTests: async (): Promise<{ testFiles: string[] }> => {
  const response = await automationApi.get<{ testFiles: string[] }>('/api/tests/available');
  return response.data;
},
```

### Step 3: Update Screenshot URLs

In `src/pages/TestFailure.tsx`, update the screenshot URL construction:

```typescript
// Replace mock implementation
const screenshotFilename = data.payload.screenshot_path.split('/').pop();
setScreenshotUrl(`http://localhost:3001/screenshots/${screenshotFilename}`);
```

### Step 4: Remove API Notices

Remove the API notice banners from:
- `src/pages/TestExecution.tsx` (line ~20)
- `src/pages/TestFailure.tsx` (line ~120)

### Step 5: Update Error Handling

Review and update error messages to reflect real API responses instead of mock data fallbacks.

## Expected API Endpoints

### Automation Framework API (Port 3001)

1. **GET** `/api/tests/available`
   - Returns: `{ testFiles: string[] }`

2. **POST** `/api/tests/execute`
   - Body: `{ testFiles: string[], testCases?: any[], headless?: boolean }`
   - Returns: `TestExecution`

3. **GET** `/api/tests/execution/:id`
   - Returns: `TestExecution`

4. **GET** `/api/failures/:testId`
   - Returns: `{ testResult: TestResult, payload: FailurePayload, executionId?: string }`

5. **POST** `/api/heal`
   - Body: `{ payload: FailurePayload }`
   - Returns: `HealingResponse` (Top 5 CSS + Top 5 XPath)

6. **POST** `/api/tests/heal-and-rerun`
   - Body: `{ executionId: string, testId: string, selectedSelector: string, selectorType: 'css' | 'xpath' }`
   - Returns: Success response

### Screenshots

- **GET** `/screenshots/:filename`
   - Returns: Screenshot image file

## Data Types

All TypeScript types are defined in `src/types/index.ts`:

- `TestExecution`
- `TestResult`
- `FailurePayload`
- `HealingResponse`
- `HealedSelector`

## Testing

1. Start with one endpoint at a time
2. Test each endpoint independently
3. Verify data structures match TypeScript types
4. Handle error cases appropriately
5. Test with real automation framework when available

## Notes

- The UI is fully functional with mock data
- All components are ready for API integration
- No UI changes needed - only API service updates
- Mock data structures match expected API responses
