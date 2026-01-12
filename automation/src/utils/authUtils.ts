import { request, APIRequestContext, APIResponse } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export class AuthUtils {
  private static accessToken: string | null = null;

  /**
   * Get storage state for a specific user type and app
   */
  static async getStorageState(userType: string): Promise<string> {
    const app = process.env.APP || 'tradeApp';
    const storageStatePath = path.join(process.cwd(), `state_${userType}_${app}.json`);
    
    console.log(`Checking for storage state for user: ${userType}`);

    // If it's a Salesforce test (userType is CRMAdminQA), we always execute the token
    // and session generation flow first to ensure a fresh session.
    if (userType === 'CRMAdminQA') {
      console.log(`Salesforce mode: Executing token and session generation for ${userType}...`);
      await this.generateTokenAndState(userType, storageStatePath);
      
      if (!fs.existsSync(storageStatePath)) {
        throw new Error(`Failed to create session file at ${storageStatePath}`);
      }
      
      console.log(`Session file created successfully. Proceeding...`);
      return storageStatePath;
    }

    // For other user types, check if state file already exists and is fresh (e.g., < 1 hour old)
    if (fs.existsSync(storageStatePath)) {
      const stats = fs.statSync(storageStatePath);
      const ageInMs = Date.now() - stats.mtimeMs;
      const oneHour = 60 * 60 * 1000;
      
      if (ageInMs < oneHour) {
        console.log(`Using existing fresh storage state: ${storageStatePath}`);
        return storageStatePath;
      }
    }

    console.log(`Generating new storage state for ${userType}...`);
    await this.generateTokenAndState(userType, storageStatePath);
    return storageStatePath;
  }

  /**
   * Delete the storage state file
   */
  static async removeStorageState(userType: string): Promise<void> {
    const app = process.env.APP || 'tradeApp';
    const storageStatePath = path.join(process.cwd(), `state_${userType}_${app}.json`);
    
    if (fs.existsSync(storageStatePath)) {
      try {
        fs.unlinkSync(storageStatePath);
        console.log(`Successfully deleted session file: ${storageStatePath}`);
      } catch (e) {
        console.error(`Error deleting session file ${storageStatePath}:`, e);
      }
    }
  }

  /**
   * Core logic to get Salesforce token and save session state
   * Strictly follows the POST auth flow provided in the B2B framework
   */
  private static async generateTokenAndState(userType: string, storageStatePath: string): Promise<void> {
    const { MARKET, APP } = process.env;
    let apiUrl: string | undefined;
    let token: string | null = null;

    // Market/App specific API URL selection matching the BDD getToken logic
    if (userType === "CRMAdminQA" || (MARKET === 'morocco' && APP === 'cgc')) {
      apiUrl = process.env.API_ACCESS_SESSION_CGC_QA;
      token = await this.getSalesforceToken(userType);
    } else if (userType === "admin" || MARKET === 'prt') {
      apiUrl = process.env.PRT_API_ACCESS_SESSION;
      token = await this.getSalesforceToken(userType);
    } else {
      // Default cases from BDD framework
      apiUrl = process.env.API_ACCESS_SESSION || process.env.API_ACCESS_SESSION_CGC_QA;
      token = await this.getSalesforceToken(userType);
    }

    if (!apiUrl || !token) {
      throw new Error(`API URL or token is missing for userType: ${userType}`);
    }

    console.log(`Authenticating with session API: ${apiUrl}`);
    const requestContext: APIRequestContext = await request.newContext();
    
    // EXACT flow from user's provided Before hook: always use POST with Bearer token
    const response: APIResponse = await requestContext.post(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Failed to authenticate with ${apiUrl}: ${response.status()} ${body}`);
    }

    await requestContext.storageState({ path: storageStatePath });
    console.log(`Successfully saved session storage state to ${storageStatePath}`);
  }

  /**
   * Helper to fetch Salesforce OAuth token matching getSalesforceTokenForCGC logic
   */
  private static async getSalesforceToken(userType: string): Promise<string | null> {
    if (this.accessToken) return this.accessToken;

    let baseURL = '';
    let client_id = '';
    let client_secret = '';
    let username = '';
    let password = '';

    // Credential mapping matching the user's provided getSalesforceTokenForCGC logic
    if (userType === "CRMAdminQA") {
      username = process.env.MOROCCO_SALESFROCE_USERNAME || '';
      password = process.env.MOROCCO_SALESFROCE_PASSWORD || '';
      client_id = process.env.MOROCCO_CLIENT_ID || '';
      client_secret = process.env.MOROCCO_SECRET_ID || '';
      // Use the specific token URL from the curl if provided (my.salesforce.com domain)
      baseURL = process.env.MOROCCO_TOKEN_URL || `${process.env.MOROCCO_SALESFROCE_BASEURL_API}/services/oauth2/token`;
    } else if (userType === "admin") {
      username = process.env.PRT_SALESFORCE_USERNAME || '';
      password = process.env.PRT_SALESFORCE_PASSWORD || '';
      client_id = process.env.PRT_SALESFORCE_CLIENT_ID || '';
      client_secret = process.env.PRT_SALESFORCE_CLIENT_SECRET || '';
      baseURL = `${process.env.PRT_BASE_URL}services/oauth2/token`;
    } else if (userType === "CRMAdmin") {
      // General CRM Admin
      username = process.env.SALESFORCE_USERNAME || '';
      password = process.env.SALESFORCE_PASSWORD || '';
      client_id = process.env.SALESFORCE_CLIENT_ID || '';
      client_secret = process.env.SALESFORCE_CLIENT_SECRET || '';
      baseURL = `${process.env.BASE_URL}/services/oauth2/token`;
    }

    console.log(`Requesting OAuth token from: ${baseURL}`);

    try {
      const apiRequest = await request.newContext();
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      // Include specific cookies from the curl if provided
      if (userType === "CRMAdminQA") {
        headers['Cookie'] = 'BrowserId=RwerWTU8EfCBmIsJN83-IQ; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1';
      }

      const response = await apiRequest.post(baseURL, {
        headers,
        form: { grant_type: 'password', client_id, client_secret, username, password },
      });

      if (response.ok()) {
        const responseBody = await response.json();
        this.accessToken = responseBody.access_token;
        console.log('Access token obtained successfully.');
        return this.accessToken;
      } else {
        const errorText = await response.text();
        console.error(`OAuth failure at ${baseURL}:`, errorText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching OAuth token:', error);
      return null;
    }
  }
}
