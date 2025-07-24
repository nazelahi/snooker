"use server";

import {
  getHandicapSuggestion,
  type HandicapAdvisorInput,
  type HandicapAdvisorOutput,
} from "@/ai/flows/handicap-advisor";
import { z } from "zod";

const HandicapAdvisorInputSchema = z.object({
  playerSkillLevel: z.enum(["beginner", "intermediate", "pro"]),
  matchHistory: z.string().min(1, "Match history cannot be empty."),
  desiredFairness: z.string().min(1, "Desired fairness cannot be empty."),
});

export async function getSuggestionAction(
  input: HandicapAdvisorInput
): Promise<{ data: HandicapAdvisorOutput | null; error: string | null }> {
  try {
    const validatedInput = HandicapAdvisorInputSchema.parse(input);
    const result = await getHandicapSuggestion(validatedInput);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in getSuggestionAction:", error);
    if (error instanceof z.ZodError) {
      return { data: null, error: error.errors.map(e => e.message).join(', ') };
    }
    return {
      data: null,
      error: "Failed to get handicap suggestion from AI. Please try again.",
    };
  }
}
