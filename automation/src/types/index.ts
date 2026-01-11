export interface LocatorData {
  key: string;
  selector: string;
  selectorType: 'css' | 'xpath';
  description?: string;
  useCase?: string;
}

export interface LocatorsFile {
  [key: string]: LocatorData;
}

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

export interface HealingRequest {
  payload: FailurePayload;
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
