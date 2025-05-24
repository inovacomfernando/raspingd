
'use server';
/**
 * @fileOverview Performs SEO analysis by fetching data directly from the target URL
 * and querying a SearxNG instance for search engine presence.
 *
 * - getSeoAnalysis - A function that performs the SEO analysis.
 * - SeoAnalysisInput - The input type for the getSeoAnalysis function.
 * - SeoAnalysisOutput - The return type for the getSeoAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SeoAnalysisInputSchema = z.object({
  targetUrl: z.string().url({ message: "Invalid URL format." }).describe('The URL to analyze for SEO.'),
  keyword: z.string().optional().describe('An optional keyword to check for presence and density.'),
  searxngInstanceUrl: z.string().url().optional().describe("The base URL of the SearxNG instance to query."),
  searxngApiKey: z.string().optional().describe("Optional API key for the SearxNG instance."),
});
export type SeoAnalysisInput = z.infer<typeof SeoAnalysisInputSchema>;

const DirectFetchResultsSchema = z.object({
    pageTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    h1Headings: z.array(z.string()).optional(),
    keywordAnalysis: z.object({
        keyword: z.string(),
        isPresent: z.boolean(),
        count: z.number().optional(),
    }).optional(),
    fetchError: z.string().optional(),
}).describe("Data fetched directly from the target URL.");

const SearxngFetchResultsSchema = z.object({
    searchPerformed: z.boolean(),
    searchUrl: z.string().url().optional(),
    targetFoundInResults: z.boolean().optional(),
    resultTitle: z.string().optional(),
    resultSnippet: z.string().optional(),
    totalResultsEstimate: z.string().optional(), 
    fetchError: z.string().optional(),
}).describe("Data from querying the SearxNG instance.");


const SeoAnalysisOutputSchema = z.object({
  directFetchResults: DirectFetchResultsSchema.optional(),
  searxngSearchResults: SearxngFetchResultsSchema.optional(),
  overallErrorMessage: z.string().optional().describe("General error message if the entire analysis failed at a high level."),
});
export type SeoAnalysisOutput = z.infer<typeof SeoAnalysisOutputSchema>;


async function performRealSeoAnalysis(input: SeoAnalysisInput): Promise<SeoAnalysisOutput> {
  const output: SeoAnalysisOutput = {
    directFetchResults: {
        h1Headings: [],
    },
    searxngSearchResults: {
        searchPerformed: false,
    }
  };

  // 1. Direct Fetch from targetUrl
  try {
    const { data: htmlContent } = await axios.get(input.targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(htmlContent);

    output.directFetchResults!.pageTitle = $('title').first().text().trim() || undefined;
    output.directFetchResults!.metaDescription = $('meta[name="description"]').attr('content')?.trim() || undefined;
    
    const h1s: string[] = [];
    $('h1').each((_i, el) => {
      const h1Text = $(el).text().trim();
      if (h1Text) h1s.push(h1Text);
    });
    output.directFetchResults!.h1Headings = h1s.length > 0 ? h1s : undefined;

    if (input.keyword) {
      const bodyText = $('body').text().toLowerCase();
      const keywordLower = input.keyword.toLowerCase();
      const count = (bodyText.match(new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      output.directFetchResults!.keywordAnalysis = {
        keyword: input.keyword,
        isPresent: count > 0,
        count: count > 0 ? count : undefined,
      };
    }
  } catch (error: any) {
    console.error(`SEO Analysis: Error fetching targetUrl ${input.targetUrl}:`, error.message);
    output.directFetchResults!.fetchError = `Failed to fetch or parse ${input.targetUrl}: ${error.message}`;
  }

  // 2. SearxNG Fetch
  if (input.searxngInstanceUrl && input.keyword) {
    output.searxngSearchResults!.searchPerformed = true;
    const siteQuery = input.targetUrl.startsWith('http') ? new URL(input.targetUrl).hostname : input.targetUrl;
    const searchQuery = `site:${siteQuery} "${input.keyword}"`;
    // Ensure SearxNG URL doesn't have trailing slash before appending /search
    const baseUrl = input.searxngInstanceUrl.replace(/\/$/, '');
    const searxngQueryUrl = `${baseUrl}/search?q=${encodeURIComponent(searchQuery)}&format=json&language=en`; 
    output.searxngSearchResults!.searchUrl = searxngQueryUrl;

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'RaspingD SEO Analyzer/1.0', // Custom User-Agent
      };
      if (input.searxngApiKey) {
        headers['Authorization'] = `Bearer ${input.searxngApiKey}`; 
      }

      const { data: searxngData } = await axios.get(searxngQueryUrl, { headers });
      
      if (searxngData.results && Array.isArray(searxngData.results)) {
        const targetResult = searxngData.results.find((res: any) => res.url && res.url.includes(input.targetUrl));
        if (targetResult) {
          output.searxngSearchResults!.targetFoundInResults = true;
          output.searxngSearchResults!.resultTitle = targetResult.title || undefined;
          output.searxngSearchResults!.resultSnippet = targetResult.content || targetResult.description || undefined;
        } else {
          output.searxngSearchResults!.targetFoundInResults = false;
        }
      }
      output.searxngSearchResults!.totalResultsEstimate = searxngData.infoboxes?.[0]?.content || searxngData.answers?.[0] || undefined;


    } catch (error: any) {
      console.error(`SEO Analysis: Error querying SearxNG instance ${input.searxngInstanceUrl}:`, error.message);
      let fetchErrorMessage = `Failed to query SearxNG: ${error.message}`;
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        fetchErrorMessage = "SearxNG query failed due to rate limiting (429 Too Many Requests). Please try again later or use a different instance if available.";
      }
      output.searxngSearchResults!.fetchError = fetchErrorMessage;
    }
  } else if (input.searxngInstanceUrl && !input.keyword) {
     output.searxngSearchResults!.searchPerformed = true; // Attempted but not fully executed
     output.searxngSearchResults!.fetchError = "SearxNG search not performed: Keyword is required when an instance is selected.";
  }


  if (!output.directFetchResults?.pageTitle && output.directFetchResults?.fetchError && !output.searxngSearchResults?.searchPerformed && output.searxngSearchResults?.fetchError) {
    output.overallErrorMessage = "Could not perform any analysis. Both direct fetch and SearxNG query failed or were not applicable.";
  }


  return output;
}

const getSeoAnalysisFlow = ai.defineFlow(
  {
    name: 'getSeoAnalysisFlow',
    inputSchema: SeoAnalysisInputSchema,
    outputSchema: SeoAnalysisOutputSchema,
  },
  async (input) => {
    return await performRealSeoAnalysis(input);
  }
);

export async function getSeoAnalysis(input: SeoAnalysisInput): Promise<SeoAnalysisOutput> {
  return getSeoAnalysisFlow(input);
}

