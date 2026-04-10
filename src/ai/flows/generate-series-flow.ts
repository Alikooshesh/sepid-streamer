'use server';
/**
 * @fileOverview AI Series Generation Flow
 *
 * This flow analyzes a single episode URL to identify its pattern and
 * generates a full list of episode URLs for the same season using Gemini 1.5 Flash.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSeriesInputSchema = z.object({
  url: z.string().describe('The URL of a single episode in a series.'),
});

const GenerateSeriesOutputSchema = z.object({
  seriesTitle: z.string().describe('The detected title of the series and season.'),
  episodes: z.array(z.object({
    title: z.string().describe('The title of the episode (e.g., Episode 01).'),
    url: z.string().describe('The generated URL for this episode.'),
  })).describe('The predicted list of episode URLs for the season.'),
});

export type GenerateSeriesInput = z.infer<typeof GenerateSeriesInputSchema>;
export type GenerateSeriesOutput = z.infer<typeof GenerateSeriesOutputSchema>;

export async function generateSeriesFromUrl(input: GenerateSeriesInput): Promise<GenerateSeriesOutput> {
  return generateSeriesFlow(input);
}

const generateSeriesFlow = ai.defineFlow(
  {
    name: 'generateSeriesFlow',
    inputSchema: GenerateSeriesInputSchema,
    outputSchema: GenerateSeriesOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `You are an expert at identifying media URL patterns. 
      Analyze this episode URL: ${input.url}
      
      Identify the episode numbering pattern (e.g., S02E09, Episode.1, 2x05).
      Generate a list of episode URLs for the same season, starting from episode 1 up to a reasonable maximum for a season (usually 10-24 episodes depending on the context).
      
      Requirements:
      1. Keep the base domain, path, and file extensions exactly the same.
      2. Only modify the episode number part of the filename.
      3. Extract a descriptive Series Title (including season).
      4. Ensure padding is preserved (e.g., if it uses E01, continue with E02, not E2).
      
      If the URL looks like '...S02E09...', generate S02E01 through S02E10 (or up to 24 if typical).`,
      output: { schema: GenerateSeriesOutputSchema },
    });

    if (!output) {
      throw new Error('AI failed to generate the series URLs.');
    }

    return output;
  }
);
