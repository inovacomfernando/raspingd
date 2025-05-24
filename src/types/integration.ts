
export interface Integration {
  id: string;
  name: string;
  serviceType: "api_key" | "oauth_token" | "access_token" | "pagespeed_api_key" | "searxng_instance";
  apiUrl?: string; // For SearxNG instance URL primarily
  apiKey?: string; // For PageSpeed API key, or generic API keys/tokens
  status: "Active" | "Inactive";
  lastUsed: string; // ISO Date string
  description?: string;
}
