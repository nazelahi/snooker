'use server';

/**
 * @fileOverview An AI agent for providing handicap suggestions to snooker players.
 *
 * - getHandicapSuggestion - A function that returns a handicap suggestion.
 * - HandicapAdvisorInput - The input type for the getHandicapSuggestion function.
 * - HandicapAdvisorOutput - The return type for the getHandicapSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HandicapAdvisorInputSchema = z.object({
  playerSkillLevel: z
    .enum(['beginner', 'intermediate', 'pro'])
    .describe('The skill level of the player.'),
  matchHistory: z
    .string()
    .describe(
      'A string describing the match history of the player, including opponents, scores, and dates.'
    ),
  desiredFairness: z
    .string()
    .describe(
      'The desired level of fairness for the match (e.g., very fair, somewhat fair, challenging).'
    ),
});
export type HandicapAdvisorInput = z.infer<typeof HandicapAdvisorInputSchema>;

const HandicapAdvisorOutputSchema = z.object({
  handicapSuggestion: z
    .string()
    .describe('The suggested handicap for the player.'),
  explanation: z
    .string()
    .describe('The explanation of why the handicap was suggested.'),
});
export type HandicapAdvisorOutput = z.infer<typeof HandicapAdvisorOutputSchema>;

export async function getHandicapSuggestion(
  input: HandicapAdvisorInput
): Promise<HandicapAdvisorOutput> {
  return handicapAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'handicapAdvisorPrompt',
  input: {schema: HandicapAdvisorInputSchema},
  output: {schema: HandicapAdvisorOutputSchema},
  prompt: `You are an expert snooker coach, advising players on appropriate handicaps for their matches.

  Based on the player's skill level, match history, and desired fairness, suggest a handicap and explain your reasoning.

  Skill Level: {{{playerSkillLevel}}}
  Match History: {{{matchHistory}}}
  Desired Fairness: {{{desiredFairness}}}

  Consider these factors when determining the handicap:
  - Skill level of the player
  - The player's win/loss ratio
  - The difficulty of the opponents in the match history
  - The desired level of fairness for the match

  Provide a handicap suggestion and explain your reasoning. The handicap suggestion should be short, example: "+15 points", "-10 points", or "Give ball in hand".
  The explanation should be two sentences.
  `,
});

const handicapAdvisorFlow = ai.defineFlow(
  {
    name: 'handicapAdvisorFlow',
    inputSchema: HandicapAdvisorInputSchema,
    outputSchema: HandicapAdvisorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
