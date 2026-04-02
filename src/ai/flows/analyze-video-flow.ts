'use server';
/**
 * @fileOverview AI Video Analysis Flow
 *
 * This flow analyzes a video based on its title and URL to provide a summary, 
 * simulated transcript, and suggested video chapters.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeVideoInputSchema = z.object({
  videoUrl: z.string().describe('The URL of the video to analyze.'),
  title: z.string().describe('The title or filename of the video.'),
});

const AnalyzeVideoOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the video content.'),
  transcript: z.string().describe('An overview of the dialogue or narration.'),
  chapters: z.array(z.object({
    timestamp: z.string().describe('The timestamp of the chapter (e.g., 02:30).'),
    title: z.string().describe('The title of the chapter.'),
  })).describe('A list of key chapters in the video.'),
});

export type AnalyzeVideoInput = z.infer<typeof AnalyzeVideoInputSchema>;
export type AnalyzeVideoOutput = z.infer<typeof AnalyzeVideoOutputSchema>;

export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
  return analyzeVideoFlow(input);
}

const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are an expert video analyst. Analyze the following video: 
      
      Title: ${input.title}
      URL: ${input.videoUrl}
      
      Based on the context provided by the title and the nature of the URL, please provide:
      1. A detailed summary of what this video is likely about.
      2. A transcript overview that highlights key points discussed.
      3. A list of meaningful chapters with logical timestamps.
      
      Be as descriptive as possible given the metadata.`,
      output: { schema: AnalyzeVideoOutputSchema },
    });

    if (!output) {
      throw new Error('AI failed to generate a response for the video analysis.');
    }

    return output;
  }
);
