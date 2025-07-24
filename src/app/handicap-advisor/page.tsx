import { HandicapAdvisorForm } from "@/components/handicap-advisor-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export default function HandicapAdvisorPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
            <BrainCircuit className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold">Handicap Advisor</h1>
                <p className="text-muted-foreground">
                    Get an AI-powered handicap suggestion for fair and exciting matches.
                </p>
            </div>
        </div>
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Generate Suggestion</CardTitle>
          <CardDescription>
            Fill in the details below to get a handicap suggestion from our AI
            coach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HandicapAdvisorForm />
        </CardContent>
      </Card>
    </div>
  );
}
