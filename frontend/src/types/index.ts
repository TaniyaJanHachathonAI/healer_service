export interface HealRequest {
  selector: string;
  url?: string;
  screenshot?: string;
  selector_type?: 'css' | 'xpath';
}

export interface HealResponse {
  healed_selector: string;
  confidence: number;
  stability_score?: number;
  semantic_score?: number;
  method: string;
  processing_time_ms?: number;
}

export interface BatchHealRequest {
  selectors: string[];
  url?: string;
  screenshot?: string;
  selector_type?: 'css' | 'xpath';
}

export interface BatchHealResponse {
  results: Array<{
    original_selector: string;
    healed_selector: string;
    confidence: number;
    stability_score?: number;
    semantic_score?: number;
    method: string;
    processing_time_ms?: number;
  }>;
  total_processing_time_ms?: number;
}

export interface HistoryEntry {
  id: string;
  original_selector: string;
  healed_selector: string;
  confidence: number;
  stability_score?: number;
  semantic_score?: number;
  method: string;
  processing_time_ms?: number;
  timestamp: string;
  url?: string;
}

export interface HistoryResponse {
  entries: HistoryEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface StatsResponse {
  total_healings: number;
  success_rate: number;
  average_confidence: number;
  average_processing_time_ms: number;
  total_feedback: number;
  positive_feedback_count: number;
  methods_used: Record<string, number>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

export interface FeedbackRequest {
  healing_id: string;
  feedback_type: 'positive' | 'negative';
  comment?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: 'connected' | 'disconnected';
  llm_available: boolean;
  version?: string;
}

// Automation Framework Types
export interface FailurePayload {
  failed_selector: string;
  html: string;
  semantic_dom: string;
  use_of_selector: string;
  full_coverage: boolean;
  page_url: string;
  screenshot_path: string;
  selector_type: 'css' | 'xpath' | 'mixed';
  test_name?: string;
  locator_key?: string;
  timestamp?: string;
}

export interface HealedSelector {
  RankIndex: number;
  Score: number;
  BaseSim: number;
  AttrScore: number;
  Tag: string;
  Text: string;
  Role: string;
  'Suggested Selector': string;
  XPath: string;
}

export interface HealingResponse {
  css_selectors: HealedSelector[];
  xpath_selectors: HealedSelector[];
  auto_selected?: {
    css?: string;
    xpath?: string;
  };
}

export interface TestResult {
  id: string;
  testName: string;
  status: 'passed' | 'failed' | 'healed';
  startTime: string;
  endTime?: string;
  duration?: number;
  failure?: {
    error: string;
    payload: FailurePayload;
    healed?: boolean;
    selectedLocator?: string;
  };
  screenshot?: string;
  report?: string;
}

export interface TestExecution {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  healedTests: number;
}

export interface ExecuteTestsRequest {
  testFiles: string[];
  testCases?: any[];
  headless?: boolean;
}
