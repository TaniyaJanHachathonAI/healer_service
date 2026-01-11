import type { FailurePayload, HealingResponse } from '../types';

export class HealerClient {
  private healerApiUrl: string;

  constructor(healerApiUrl: string = process.env.HEALER_API_URL || 'http://127.0.0.1:9001') {
    this.healerApiUrl = healerApiUrl;
  }

  /**
   * Send failure payload to healer API and get healed selectors
   */
  async healSelector(payload: FailurePayload, options: any = {}): Promise<any> {
    try {
      // Build the dynamic payload for the Python API
      // Alignment with healer_service-main/models.py:HealRequest
      const healRequest = {
        failed_selector: payload.failed_selector || 'Unknown',
        html: payload.html,
        semantic_dom: payload.semantic_dom,
        interactive_elements: payload.semantic_dom?.elements || [],
        page_url: payload.page_url,
        use_of_selector: payload.use_of_selector,
        full_coverage: payload.full_coverage ?? true,
        screenshot_path: payload.screenshot_path,
        selector_type: options.selector_type || (payload.selector_type === 'mixed' ? 'mixed' : payload.selector_type) || 'mixed',
        ...options // Allow overriding any field
      };

      console.log(`Calling Python Healer API at ${this.healerApiUrl}/heal with failed selector: ${healRequest.failed_selector}`);
      
      // Log truncated payload for debugging
      console.log('Heal Request Body (truncated):', JSON.stringify({ 
        ...healRequest, 
        html: healRequest.html ? `${healRequest.html.substring(0, 100)}...` : null,
        semantic_dom: healRequest.semantic_dom ? 'PRESENT' : null,
        interactive_elements: healRequest.interactive_elements ? `COUNT: ${healRequest.interactive_elements.length}` : null
      }, null, 2));

      const response = await fetch(`${this.healerApiUrl}/heal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healRequest),
      }).catch(err => {
        console.error('Fetch failed in HealerClient:', err.message);
        throw new Error(`Failed to connect to Healer Service at ${this.healerApiUrl}. Is it running?`);
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Python Healer API returned error ${response.status}:`, errorText);
        throw new Error(`Healer API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      console.log(`Healer API Success: Received ${data.candidates?.length || 0} candidates`);
      return data;
    } catch (error) {
      console.error('Error in HealerClient.healSelector:', error);
      throw error;
    }
  }
}
