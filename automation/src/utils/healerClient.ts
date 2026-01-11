import type { FailurePayload, HealingResponse } from '../types';

export class HealerClient {
  private healerApiUrl: string;

  constructor(healerApiUrl: string = process.env.HEALER_API_URL || 'http://localhost:8000') {
    this.healerApiUrl = healerApiUrl;
  }

  /**
   * Send failure payload to healer API and get healed selectors
   */
  async healSelector(payload: FailurePayload): Promise<HealingResponse> {
    try {
      const response = await fetch(`${this.healerApiUrl}/heal-failure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Healer API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Transform response to expected format
      return {
        css_selectors: data.css_selectors || data.top_5_css || [],
        xpath_selectors: data.xpath_selectors || data.top_5_xpath || [],
        auto_selected: data.auto_selected || {},
      };
    } catch (error) {
      console.error('Error calling healer API:', error);
      throw error;
    }
  }
}
