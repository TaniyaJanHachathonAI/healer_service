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
  HealingResponse,
  TestResult
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:9001';
const AUTOMATION_API_URL = (import.meta as any).env?.VITE_AUTOMATION_API_URL || 'http://127.0.0.1:3001';

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
    url_filter?: string;
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
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },

  // Automation Framework APIs
  
  // Get available test files
  getAvailableTests: async (): Promise<{ testFiles: string[] }> => {
    const response = await automationApi.get<{ testFiles: string[] }>('/api/tests/available');
    return response.data;
  },

  // Execute tests
  executeTests: async (request: ExecuteTestsRequest): Promise<TestExecution> => {
    const response = await automationApi.post<TestExecution>('/api/tests/execute', request);
    return response.data;
  },

  // Get execution status
  getExecution: async (executionId: string): Promise<TestExecution> => {
    const response = await automationApi.get<TestExecution>(`/api/tests/execution/${executionId}`);
    return response.data;
  },

  // Get all execution reports
  getAllReports: async (): Promise<any[]> => {
    const response = await automationApi.get<any[]>('/api/reports');
    return response.data;
  },

  // Get failure details
  getFailure: async (testId: string): Promise<{ testResult: TestResult; payload: FailurePayload; executionId?: string }> => {
    const response = await automationApi.get(`/api/failures/${testId}`);
    return response.data;
  },

  // Heal selector via automation API (which calls healer service)
  healFailure: async (payload: FailurePayload, options: any = {}): Promise<HealingResponse> => {
    const response = await automationApi.post<HealingResponse>('/api/heal', { payload, options });
    return response.data;
  },

  // Heal and re-run test
  healAndRerun: async (request: {
    executionId: string;
    testId: string;
    selectedSelector: string;
    selectorType: 'css' | 'xpath';
  }): Promise<any> => {
    const response = await automationApi.post('/api/tests/heal-and-rerun', request);
    return response.data;
  },
};

export default apiService;
