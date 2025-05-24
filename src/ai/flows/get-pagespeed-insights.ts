
'use server';
/**
 * @fileOverview Retrieves Google PageSpeed Insights for a given URL.
 *
 * - getPagespeedInsights - A function that fetches PageSpeed Insights.
 * - PageSpeedInput - The input type for the getPagespeedInsights function.
 * - PageSpeedOutput - The return type for the getPagespeedInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import axios from 'axios';

const PageSpeedInputSchema = z.object({
  targetUrl: z.string().url({ message: "Invalid URL format." }).describe('The URL to analyze with PageSpeed Insights.'),
  apiKey: z.string().optional().describe('Optional Google API Key for PageSpeed Insights.'),
});
export type PageSpeedInput = z.infer<typeof PageSpeedInputSchema>;

const LighthouseAuditResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  displayValue: z.string().optional(),
  score: z.number().nullable(),
  numericValue: z.number().optional(),
  description: z.string().optional(),
});

const PageSpeedOutputSchema = z.object({
  performanceScore: z.number().nullable().describe('Overall performance score (0-1).'),
  metrics: z.object({
    firstContentfulPaint: LighthouseAuditResultSchema.optional(),
    largestContentfulPaint: LighthouseAuditResultSchema.optional(),
    cumulativeLayoutShift: LighthouseAuditResultSchema.optional(),
    speedIndex: LighthouseAuditResultSchema.optional(),
    interactive: LighthouseAuditResultSchema.optional(), // Time to Interactive
    totalBlockingTime: LighthouseAuditResultSchema.optional(),
  }).describe("Key performance metrics."),
  screenshotData: z.string().optional().describe("Base64 encoded screenshot data of the page's final load."),
  loadExperience: z
    .object({
      id: z.string().optional(),
      metrics: z.record(z.string(), z.any()).optional(),
      overall_category: z.string().optional(),
      initial_url: z.string().optional(),
    })
    .optional()
    .describe('Real-user experience data (CrUX).'),
  errorMessage: z.string().optional().describe("Error message if the analysis failed."),
});
export type PageSpeedOutput = z.infer<typeof PageSpeedOutputSchema>;

async function fetchPagespeedData(input: PageSpeedInput): Promise<PageSpeedOutput> {
  const { targetUrl, apiKey } = input;
  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&category=PERFORMANCE`;

  if (apiKey) {
    apiUrl += `&key=${apiKey}`;
  }

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.error) {
      console.error("PageSpeed API Error:", data.error.message);
      return {
        performanceScore: null,
        metrics: {},
        errorMessage: data.error.message,
      };
    }
    
    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;

    const getAudit = (id: string) => audits[id] ? {
        id: audits[id].id,
        title: audits[id].title,
        displayValue: audits[id].displayValue,
        score: audits[id].score,
        numericValue: audits[id].numericValue,
        description: audits[id].description,
    } : undefined;

    return {
      performanceScore: lighthouseResult.categories.performance.score,
      metrics: {
        firstContentfulPaint: getAudit('first-contentful-paint'),
        largestContentfulPaint: getAudit('largest-contentful-paint'),
        cumulativeLayoutShift: getAudit('cumulative-layout-shift'),
        speedIndex: getAudit('speed-index'),
        interactive: getAudit('interactive'),
        totalBlockingTime: getAudit('total-blocking-time'),
      },
      screenshotData: audits['final-screenshot']?.details?.data,
      loadExperience: data.loadingExperience,
      errorMessage: undefined,
    };
  } catch (error: any) {
    console.error("Failed to fetch PageSpeed data:", error);
    const message = error.response?.data?.error?.message || error.message || "An unknown error occurred";
    return {
        performanceScore: null,
        metrics: {},
        errorMessage: message,
    };
  }
}

const getPagespeedInsightsFlow = ai.defineFlow(
  {
    name: 'getPagespeedInsightsFlow',
    inputSchema: PageSpeedInputSchema,
    outputSchema: PageSpeedOutputSchema,
  },
  async (input) => {
    return await fetchPagespeedData(input);
  }
);

// Exported wrapper function
export async function getPagespeedInsights(input: PageSpeedInput): Promise<PageSpeedOutput> {
  return getPagespeedInsightsFlow(input);
}
