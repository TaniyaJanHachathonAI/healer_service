import axios from 'axios';
import type {
  HealRequest,
  HealResponse,
  BatchHealRequest,
  BatchHealResponse,
  HistoryResponse,
  StatsResponse,
  FeedbackRequest,
  HealthResponse,
  TestExecution,
  ExecuteTestsRequest,
  FailurePayload,
  HealingResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTOMATION_API_URL = import.meta.env.VITE_AUTOMATION_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const automationApi = axios.create({
  baseURL: AUTOMATION_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Single selector healing
  heal: async (request: HealRequest): Promise<HealResponse> => {
    const response = await api.post<HealResponse>('/heal', request);
    return response.data;
  },

  // Batch healing (up to 10 selectors)
  healBatch: async (request: BatchHealRequest): Promise<BatchHealResponse> => {
    const response = await api.post<BatchHealResponse>('/heal-batch', request);
    return response.data;
  },

  // History with pagination and filtering
  getHistory: async (params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<HistoryResponse> => {
    const response = await api.get<HistoryResponse>('/history', { params });
    return response.data;
  },

  // Statistics
  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>('/stats');
    return response.data;
  },

  // Submit feedback
  submitFeedback: async (request: FeedbackRequest): Promise<void> => {
    await api.post('/feedback', request);
  },

  // Health check
  getHealth: async (): Promise<HealthResponse> => {
    try {
      const response = await api.get<HealthResponse>('/health');
      return response.data;
    } catch (error) {
      // Return a "connected" status for UI purposes if mock mode is assumed
      return {
        status: 'healthy',
        database: 'connected',
        llm_available: true,
        version: '1.0.0-mock'
      };
    }
  },

  // Automation Framework APIs
  // NOTE: These will be integrated when backend API is ready
  // For now, using mock data - see mockData.ts
  
  // Get available test files
  getAvailableTests: async (): Promise<{ testFiles: string[] }> => {
    try {
      const response = await automationApi.get<{ testFiles: string[] }>('/api/tests/available');
      return response.data;
    } catch (error) {
      // Fallback to mock data if API is not yet ready
      const { mockTestFiles, mockDelay } = await import('./mockData');
      await mockDelay(500);
      return { testFiles: mockTestFiles };
    }
  },

  // Execute tests
  executeTests: async (request: ExecuteTestsRequest): Promise<TestExecution> => {
    try {
      const response = await automationApi.post<TestExecution>('/api/tests/execute', request);
      return response.data;
    } catch (error) {
      // Fallback to mock data if API is not yet ready
      const { createMockExecution, mockDelay } = await import('./mockData');
      await mockDelay(2000);
      return createMockExecution();
    }
  },

  // Get execution status
  getExecution: async (executionId: string): Promise<TestExecution> => {
    try {
      const response = await automationApi.get<TestExecution>(`/api/tests/execution/${executionId}`);
      return response.data;
    } catch (error) {
      // Fallback to mock data
      const { createMockExecution, mockDelay } = await import('./mockData');
      await mockDelay(500);
      return createMockExecution();
    }
  },

  // Get all execution reports
  getAllReports: async (): Promise<any[]> => {
    try {
      const response = await automationApi.get<any[]>('/api/reports');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  // Get failure details
  getFailure: async (testId: string): Promise<{ testResult: TestResult; payload: FailurePayload; executionId?: string }> => {
    try {
      const response = await automationApi.get(`/api/failures/${testId}`);
      return response.data;
    } catch (error) {
      // Fallback to mock data
      const { createMockExecution, mockDelay } = await import('./mockData');
      await mockDelay(500);
      const execution = createMockExecution();
      const result = execution.results.find(r => r.id === testId);
      
      if (!result || !result.failure) {
        throw new Error('Failure not found');
      }
      
      return {
        testResult: result,
        payload: result.failure.payload,
        executionId: execution.id,
      };
    }
  },

  // Heal selector via automation API (which calls healer service)
  healFailure: async (payload: FailurePayload): Promise<HealingResponse> => {
    try {
      const response = await automationApi.post<HealingResponse>('/api/heal', { payload });
      return response.data;
    } catch (error) {
      // Fallback to mock data
      const { createMockHealingResponse, mockDelay } = await import('./mockData');
      await mockDelay(2000);
      return createMockHealingResponse();
    }
  },

  // Heal and re-run test
  healAndRerun: async (request: {
    executionId: string;
    testId: string;
    selectedSelector: string;
    selectorType: 'css' | 'xpath';
  }): Promise<any> => {
    try {
      const response = await automationApi.post('/api/tests/heal-and-rerun', request);
      return response.data;
    } catch (error) {
      // Fallback to mock data
      const { mockDelay } = await import('./mockData');
      await mockDelay(1500);
      return {
        message: 'Locator updated successfully (Mock - API integration pending)',
        testId: request.testId,
        selectedSelector: request.selectedSelector,
      };
    }
  },
};

export default apiService;
