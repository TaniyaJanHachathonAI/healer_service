import * as fs from 'fs';
import * as path from 'path';
import { Page } from '@playwright/test';
import type { FailurePayload } from '../types';

export class FailureCapture {
  private screenshotsDir: string;
  private failuresDir: string;

  constructor(
    screenshotsDir: string = path.join(__dirname, '../../test-results/screenshots'),
    failuresDir: string = path.join(__dirname, '../../test-results/failures')
  ) {
    this.screenshotsDir = screenshotsDir;
    this.failuresDir = failuresDir;
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    [this.screenshotsDir, this.failuresDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Extract semantic DOM data (interactive elements only)
   */
  private async extractSemanticDOM(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const interactiveElements = [
        'a', 'button', 'input', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role="tab"]',
        '[role="menuitem"]', '[role="checkbox"]', '[role="radio"]',
        '[onclick]', '[tabindex]', '[contenteditable="true"]',
        'nav', 'form', 'label'
      ];

      const elements = document.querySelectorAll(interactiveElements.join(','));
      const semanticData: any[] = [];

      elements.forEach((el: any) => {
        // Get bounding box for vision alignment
        const rect = el.getBoundingClientRect();
        
        // Skip hidden elements
        if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') {
          return;
        }

        const attributes: Record<string, string> = {};
        Array.from(el.attributes).forEach((attr: any) => {
          attributes[attr.name] = attr.value;
        });

        semanticData.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().substring(0, 150),
          accessible_name: el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '',
          role: el.getAttribute('role') || el.tagName.toLowerCase(),
          attributes,
          id: el.id,
          classes: Array.from(el.classList),
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          // Basic XPath for fallback
          xpath: (() => {
            const parts = [];
            let current: any = el;
            while (current && current.nodeType === 1) {
              let index = 0;
              let sibling = current.previousSibling;
              while (sibling) {
                if (sibling.nodeType === 1 && sibling.tagName === current.tagName) {
                  index++;
                }
                sibling = sibling.previousSibling;
              }
              const tagName = current.tagName.toLowerCase();
              const pathIndex = index > 0 ? `[${index + 1}]` : '';
              parts.unshift(`${tagName}${pathIndex}`);
              current = current.parentNode;
            }
            return parts.length ? `/${parts.join('/')}` : '';
          })()
        });
      });

      return {
        type: 'semantic_dom',
        timestamp: new Date().toISOString(),
        total_elements: semanticData.length,
        elements: semanticData
      };
    });
  }

  /**
   * Capture failure data and create payload
   */
  async captureFailure(
    page: Page,
    failedSelector: string,
    useOfSelector: string,
    testName: string,
    locatorKey: string
  ): Promise<FailurePayload> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFileName = `failure-${timestamp}.png`;
    const screenshotPath = path.join(this.screenshotsDir, screenshotFileName);

    // Capture screenshot
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });

    // Capture HTML
    const html = await page.content();

    // Extract semantic DOM
    const semanticDom = await this.extractSemanticDOM(page);

    // Determine selector type
    const selectorType: 'css' | 'xpath' | 'mixed' = 
      failedSelector.startsWith('//') || failedSelector.startsWith('(//') 
        ? 'xpath' 
        : failedSelector.includes('//') 
          ? 'mixed' 
          : 'css';

    const payload: FailurePayload = {
      failed_selector: failedSelector,
      html,
      semantic_dom: semanticDom,
      use_of_selector: useOfSelector,
      full_coverage: true,
      page_url: page.url(),
      screenshot_path: screenshotPath,
      selector_type: selectorType,
      test_name: testName,
      locator_key: locatorKey,
      timestamp: new Date().toISOString(),
    };

    // Save payload to file
    this.saveFailurePayload(payload, timestamp);

    return payload;
  }

  /**
   * Save failure payload to JSON file
   */
  private saveFailurePayload(payload: FailurePayload, timestamp: string): void {
    const fileName = `failure-${timestamp}.json`;
    const filePath = path.join(this.failuresDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }

  /**
   * Load a saved failure payload
   */
  loadFailurePayload(fileName: string): FailurePayload | null {
    const filePath = path.join(this.failuresDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as FailurePayload;
    } catch (error) {
      console.error(`Error loading failure payload from ${filePath}:`, error);
      return null;
    }
  }
}
