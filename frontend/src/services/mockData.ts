// Mock data service - Replace with actual API calls when backend is integrated
import type { TestExecution, FailurePayload, HealingResponse, HealedSelector } from '../types';

// Mock test files
export const mockTestFiles = [
  'example',
  'login',
  'checkout',
  'search',
];

// Mock execution data
export const createMockExecution = (): TestExecution => {
  return {
    id: 'exec-mock-id',
    status: 'completed',
    startTime: new Date(Date.now() - 60000).toISOString(),
    endTime: new Date().toISOString(),
    totalTests: 5,
    passedTests: 3,
    failedTests: 2,
    healedTests: 0,
    results: [
      {
        id: 'test-1',
        testName: 'Test: Click on logomark wrapper',
        status: 'passed',
        startTime: new Date(Date.now() - 55000).toISOString(),
        endTime: new Date(Date.now() - 50000).toISOString(),
        duration: 5000,
      },
      {
        id: 'test-2',
        testName: 'Test: Login form submission',
        status: 'failed',
        startTime: new Date(Date.now() - 45000).toISOString(),
        endTime: new Date(Date.now() - 40000).toISOString(),
        duration: 5000,
        failure: {
          error: 'Element not found: selector "card__logomark__wrapper12as3aas"',
          payload: {
            failed_selector: 'card__logomark__wrapper12as3aas pbc-g-elevation-2 a imageasda',
            html: '<html>...</html>',
            semantic_dom: '[]',
            use_of_selector: 'click on logomark wrapper pepsico',
            full_coverage: true,
            page_url: 'https://www.salesforce.com/in/consumer-goods/',
            screenshot_path: '/test-results/screenshots/failure-1.png',
            selector_type: 'mixed',
            test_name: 'Test: Click on logomark wrapper',
            locator_key: 'logoMark',
            timestamp: new Date().toISOString(),
          },
        },
        screenshot: '/test-results/screenshots/failure-1.png',
      },
      {
        id: 'test-3',
        testName: 'Test: Search functionality',
        status: 'passed',
        startTime: new Date(Date.now() - 35000).toISOString(),
        endTime: new Date(Date.now() - 30000).toISOString(),
        duration: 5000,
      },
      {
        id: 'test-4',
        testName: 'Test: Add to cart button',
        status: 'failed',
        startTime: new Date(Date.now() - 25000).toISOString(),
        endTime: new Date(Date.now() - 20000).toISOString(),
        duration: 5000,
        failure: {
          error: 'Element not found: selector "button.add-to-cart"',
          payload: {
            failed_selector: 'button.add-to-cart',
            html: '<html>...</html>',
            semantic_dom: '[]',
            use_of_selector: 'click add to cart button',
            full_coverage: true,
            page_url: 'https://www.salesforce.com/in/consumer-goods/',
            screenshot_path: '/test-results/screenshots/failure-2.png',
            selector_type: 'css',
            test_name: 'Test: Add to cart button',
            locator_key: 'addToCartButton',
            timestamp: new Date().toISOString(),
          },
        },
        screenshot: '/test-results/screenshots/failure-2.png',
      },
      {
        id: 'test-5',
        testName: 'Test: Checkout process',
        status: 'passed',
        startTime: new Date(Date.now() - 15000).toISOString(),
        endTime: new Date(Date.now() - 10000).toISOString(),
        duration: 5000,
      },
    ],
  };
};

// Mock healing response
export const createMockHealingResponse = (): HealingResponse => {
  return {
    css_selectors: [
      {
        RankIndex: 28,
        Score: 0.5125,
        BaseSim: 0.7322,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Learn about',
        Role: 'link',
        'Suggested Selector': 'a[href="doc/current/index.html"]',
        XPath: '//div/ol[1]/li[1]/a',
      },
      {
        RankIndex: 29,
        Score: 0.4399,
        BaseSim: 0.6285,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Download',
        Role: 'link',
        'Suggested Selector': 'a[href="releases.html"]',
        XPath: '//div/ol[1]/li[2]/a',
      },
      {
        RankIndex: 32,
        Score: 0.4368,
        BaseSim: 0.624,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'mailing list',
        Role: 'link',
        'Suggested Selector': 'a[href="lists.html"]',
        XPath: '//div/ol[2]/li[3]/a',
      },
      {
        RankIndex: 22,
        Score: 0.4097,
        BaseSim: 0.5852,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Events',
        Role: 'link',
        'Suggested Selector': 'a[href="events.html"]',
        XPath: '//nav/div/ul/li[3]/div/a[5]',
      },
      {
        RankIndex: 9,
        Score: 0.4092,
        BaseSim: 0.5846,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Privacy Policy',
        Role: 'link',
        'Suggested Selector': 'a[href="privacy.html"]',
        XPath: '//nav/div/ul/li[1]/div/a[7]',
      },
    ],
    xpath_selectors: [
      {
        RankIndex: 28,
        Score: 0.5125,
        BaseSim: 0.7322,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Learn about',
        Role: 'link',
        'Suggested Selector': 'a[href="doc/current/index.html"]',
        XPath: '//div/ol[1]/li[1]/a',
      },
      {
        RankIndex: 29,
        Score: 0.4399,
        BaseSim: 0.6285,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Download',
        Role: 'link',
        'Suggested Selector': 'a[href="releases.html"]',
        XPath: '//div/ol[1]/li[2]/a',
      },
      {
        RankIndex: 32,
        Score: 0.4368,
        BaseSim: 0.624,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'mailing list',
        Role: 'link',
        'Suggested Selector': 'a[href="lists.html"]',
        XPath: '//div/ol[2]/li[3]/a',
      },
      {
        RankIndex: 22,
        Score: 0.4097,
        BaseSim: 0.5852,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Events',
        Role: 'link',
        'Suggested Selector': 'a[href="events.html"]',
        XPath: '//nav/div/ul/li[3]/div/a[5]',
      },
      {
        RankIndex: 9,
        Score: 0.4092,
        BaseSim: 0.5846,
        AttrScore: 0.0,
        Tag: 'a',
        Text: 'Privacy Policy',
        Role: 'link',
        'Suggested Selector': 'a[href="privacy.html"]',
        XPath: '//nav/div/ul/li[1]/div/a[7]',
      },
    ],
    auto_selected: {
      css: 'a[href="doc/current/index.html"]',
      xpath: '//div/ol[1]/li[1]/a',
    },
  };
};

// Mock delay for simulating API calls
export const mockDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));
