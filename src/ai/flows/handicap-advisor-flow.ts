
'use server';
/**
 * @fileOverview An AI flow for providing handicap suggestions for snooker players.
 *
 * - getHandicapSuggestion - A function that returns an AI-generated handicap suggestion.
 * - HandicapAdvisorInput - The input type for the getHandicapSuggestion function.
 * - HandicapAdvisorOutput - The return type for the getHandicapSuggestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const HandicapAdvisorInputSchema = z.object({
  playerName: z.string().describe('The name of the player.'),
  skillLevel: z.string().describe('The current skill level of the player (e.g., Beginner, Intermediate, Pro).'),
  winRate: z.string().describe('The player\'s win rate as a percentage string (e.g., "55%").'),
  highestBreak: z.number().describe('The player\'s highest recorded break in a single frame.'),
  averageBreak: z.number().describe('The player\'s average break across all matches.'),
  recentMatches: z.array(z.object({
    opponent: z.string(),
    result: z.enum(['win', 'loss']),
    score: z.string(),
  })).describe('A list of the player\'s recent matches.'),
});
export type HandicapAdvisorInput = z.infer<typeof HandicapAdvisorInputSchema>;

export const HandicapAdvisorOutputSchema = z.object({
  handicap: z.number().describe('The suggested handicap score for the player. This should be a positive integer, typically between 0 and 50.'),
  reasoning: z.string().describe('A brief, one or two sentence explanation for why this handicap was suggested, based on the provided stats.'),
});
export type HandicapAdvisorOutput = z.infer<typeof HandicapAdvisorOutputSchema>;

export async function getHandicapSuggestion(input: HandicapAdvisorInput): Promise<HandicapAdvisorOutput> {
  return handicapAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'handicapAdvisorPrompt',
  input: { schema: HandicapAdvisorInputSchema },
  output: { schema: HandicapAdvisorOutputSchema },
  prompt: `You are a professional snooker coach and handicap assessor. Your task is to analyze the provided player data and suggest a fair handicap.

Analyze the following player stats:
- Player Name: {{playerName}}
- Skill Level: {{skillLevel}}
- Win Rate: {{winRate}}
- Highest Break: {{highestBreak}}
- Average Break: {{averageBreak}}

Consider their recent match history:
{{#each recentMatches}}
- vs {{opponent}}: {{result}} ({{score}})
{{/each}}

Based on all of this data, determine a suitable handicap for {{playerName}}. A lower handicap means a better player. A professional might have a handicap of 0-5, while a beginner might have a handicap of 25-50.

Provide the suggested handicap and a brief reasoning for your decision.`,
});

const handicapAdvisorFlow = ai.defineFlow(
  {
    name: 'handicapAdvisorFlow',
    inputSchema: HandicapAdvisorInputSchema,
    outputSchema: HandicapAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
