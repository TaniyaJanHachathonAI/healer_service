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
  id: number;
  old_selector: string;
  new_selector: string;
  confidence: number;
  url: string;
  timestamp: string;
  feedback_rating?: 'positive' | 'negative';
  feedback_comment?: string;
}

export interface HistoryResponse {
  items: HistoryEntry[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface StatsResponse {
  total_healings: number;
  total_with_feedback: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  success_rate: number;
  most_healed_selectors: Array<{
    selector: string;
    count: number;
  }>;
  recent_healings_count: number;
  average_confidence: number;
}

export interface FeedbackRequest {
  healing_id: number;
  rating: 'positive' | 'negative';
  comment?: string;
  actual_selector_used?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database_connected: boolean;
  llm_api_available: boolean;
  timestamp: string;
  version?: string;
}

// Automation Framework Types
export interface FailurePayload {
  failed_selector: string;
  html: string;
  semantic_dom: any;
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
