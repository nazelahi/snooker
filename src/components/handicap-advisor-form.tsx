"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSuggestionAction } from "@/app/handicap-advisor/actions";
import type { HandicapAdvisorOutput } from "@/ai/flows/handicap-advisor";
import { Loader2, Sparkles } from "lucide-react";

const formSchema = z.object({
  playerSkillLevel: z.enum(["beginner", "intermediate", "pro"], {
    required_error: "Please select a skill level.",
  }),
  matchHistory: z
    .string()
    .min(20, "Please provide at least 20 characters of match history.")
    .max(500, "Match history cannot exceed 500 characters."),
  desiredFairness: z.enum(["very fair", "somewhat fair", "challenging"], {
    required_error: "Please select a fairness level.",
  }),
});

export function HandicapAdvisorForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HandicapAdvisorOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matchHistory: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    const { data, error } = await getSuggestionAction(values);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    } else {
      setResult(data);
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="playerSkillLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Skill Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a skill level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desiredFairness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Fairness</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fairness level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="very fair">Very Fair</SelectItem>
                      <SelectItem value="somewhat fair">Somewhat Fair</SelectItem>
                      <SelectItem value="challenging">Challenging</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="matchHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match History</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Last 5 matches: Won 3, Lost 2. Beat Player A (+10) 5-3. Lost to Player B (-5) 4-5..."
                    className="resize-y min-h-[100px]"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Provide a brief summary of recent performance.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Get Suggestion
          </Button>
        </form>
      </Form>

      {result && (
        <Card className="bg-primary/10 border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles />
              AI Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-muted-foreground">
                Suggested Handicap
              </h3>
              <p className="text-2xl font-bold text-primary-foreground">
                {result.handicapSuggestion}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Explanation</h3>
              <p className="text-primary-foreground/80">{result.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
