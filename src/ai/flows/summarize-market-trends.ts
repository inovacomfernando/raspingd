
'use server';

/**
 * @fileOverview An AI agent that summarizes market trends from scraped data
 * and provides paid media keyword suggestions.
 *
 * - summarizeMarketTrends - A function that handles the market trend summarization process.
 * - SummarizeMarketTrendsInput - The input type for the summarizeMarketTrends function.
 * - SummarizeMarketTrendsOutput - The return type for the summarizeMarketTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMarketTrendsInputSchema = z.object({
  scrapedData: z
    .string()
    .describe(
      'The scraped data from various sources, including competitor information, URLs, prices, and consumer behavior data.'
    ),
  targetLanguage: z.string().optional().describe('The language code for the AI to generate its response in (e.g., "en", "pt"). Defaults to English if not provided.'),
});
export type SummarizeMarketTrendsInput = z.infer<typeof SummarizeMarketTrendsInputSchema>;

const KeywordInsightSchema = z.object({
  keyword: z.string().describe('The suggested keyword phrase.'),
  type: z.enum(['interest', 'intention']).describe('The type of user intent: "interest" for broader awareness and discovery, "intention" for specific purchase intent or active searching for solutions.'),
  platformSuitability: z.array(z.enum(['Google Ads', 'Meta Ads'])).min(1).describe('Which ad platforms this keyword is most suitable for (can be one or both).'),
  estimatedVolume: z.enum(['high', 'medium', 'low', 'n/a']).describe('A qualitative estimation of potential search volume or audience size (high, medium, low, or n/a if not applicable/estimable by the AI).'),
  rationale: z.string().describe('Brief explanation for why this keyword is suggested and its classification.'),
  language: z.string().describe('The language of the suggested keyword (e.g., "en", "pt"). Should match targetLanguage.'),
});

const SummarizeMarketTrendsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the key market trends and anomalies identified from the scraped data.'
    ),
  recommendations: z
    .string()
    .describe(
      'Actionable business recommendations based on the identified market trends and anomalies.'
    ),
  paidMediaKeywords: z
    .array(KeywordInsightSchema)
    .optional()
    .describe('A list of suggested keywords for paid media campaigns (Google Ads, Meta Ads), including their type (interest/intention), platform suitability, estimated volume, rationale, and language. Aim for 5-10 diverse keywords.'),
});
export type SummarizeMarketTrendsOutput = z.infer<typeof SummarizeMarketTrendsOutputSchema>;

export async function summarizeMarketTrends(
  input: SummarizeMarketTrendsInput
): Promise<SummarizeMarketTrendsOutput> {
  return summarizeMarketTrendsFlow(input);
}

// Helper to map language codes to full names for the prompt
const getLanguageName = (code?: string): string => {
  if (code === 'pt') return 'Portuguese';
  if (code === 'en') return 'English';
  return 'English'; // Default to English
};

const internalPromptInputSchema = SummarizeMarketTrendsInputSchema.extend({
  languageNameToUse: z.string(),
});

const prompt = ai.definePrompt({
  name: 'summarizeMarketTrendsPrompt',
  input: {schema: internalPromptInputSchema},
  output: {schema: SummarizeMarketTrendsOutputSchema},
  prompt: `You are a market analysis and digital marketing expert. Analyze the following scraped data.
Your entire response, including the summary, recommendations, and keyword suggestions, MUST be in {{languageNameToUse}}.

Scraped Data:
{{{scrapedData}}}

Based on your analysis (in {{languageNameToUse}}), provide:
1.  A summary of the key market trends and anomalies.
2.  Actionable business recommendations.
3.  Paid Media Keyword Suggestions:
    Generate a list of 5-10 diverse keyword suggestions suitable for paid media campaigns (Google Ads and Meta Ads) based on the scraped data.
    For each keyword, provide:
    -   'keyword': The keyword phrase itself (in {{languageNameToUse}}).
    -   'type': Classify the user intent as either 'interest' (for broader awareness, top-of-funnel topics, often good for Meta Ads audiences or Google Display) or 'intention' (for users actively searching for solutions or to make a purchase, often good for Google Ads Search).
    -   'platformSuitability': An array indicating if it's more suitable for ['Google Ads'], ['Meta Ads'], or ['Google Ads', 'Meta Ads'].
    -   'estimatedVolume': A qualitative estimate of its potential search volume or audience reach as 'high', 'medium', 'low', or 'n/a' if you cannot reasonably estimate.
    -   'rationale': A brief explanation of why this keyword is relevant and how it fits the classification.
    -   'language': The language of the keyword (e.g., "en", "pt", matching {{languageNameToUse}}).

Ensure your output for 'paidMediaKeywords' is an array of objects, each matching this structure. If no relevant keywords can be derived, you may return an empty array or omit the 'paidMediaKeywords' field.
`,
});

const summarizeMarketTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeMarketTrendsFlow',
    inputSchema: SummarizeMarketTrendsInputSchema,
    outputSchema: SummarizeMarketTrendsOutputSchema,
  },
  async input => {
    const languageNameToUse = getLanguageName(input.targetLanguage);
    const {output} = await prompt({
      ...input,
      languageNameToUse,
    });
    return output!;
  }
);
