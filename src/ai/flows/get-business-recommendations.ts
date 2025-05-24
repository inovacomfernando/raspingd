'use server';

/**
 * @fileOverview Provides actionable business recommendations based on identified trends and anomalies.
 *
 * - getBusinessRecommendations - A function that generates business recommendations.
 * - BusinessRecommendationsInput - The input type for the getBusinessRecommendations function.
 * - BusinessRecommendationsOutput - The return type for the getBusinessRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BusinessRecommendationsInputSchema = z.object({
  trends: z.string().describe('Identified trends from the scraped data.'),
  anomalies: z.string().describe('Identified anomalies from the scraped data.'),
  additionalContext: z.string().optional().describe('Any additional context to provide to the AI.'),
});
export type BusinessRecommendationsInput = z.infer<typeof BusinessRecommendationsInputSchema>;

const BusinessRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('Actionable business recommendations based on the trends and anomalies.'),
});
export type BusinessRecommendationsOutput = z.infer<typeof BusinessRecommendationsOutputSchema>;

export async function getBusinessRecommendations(
  input: BusinessRecommendationsInput
): Promise<BusinessRecommendationsOutput> {
  return getBusinessRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'businessRecommendationsPrompt',
  input: {schema: BusinessRecommendationsInputSchema},
  output: {schema: BusinessRecommendationsOutputSchema},
  prompt: `You are an expert business consultant. Based on the following trends and anomalies identified in market data, provide actionable business recommendations.

Trends: {{{trends}}}
Anomalies: {{{anomalies}}}

Additional Context: {{{additionalContext}}}

Provide clear and concise recommendations that can be immediately implemented to improve business strategy and outcomes.
`,
});

const getBusinessRecommendationsFlow = ai.defineFlow(
  {
    name: 'getBusinessRecommendationsFlow',
    inputSchema: BusinessRecommendationsInputSchema,
    outputSchema: BusinessRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
