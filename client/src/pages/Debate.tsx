import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Users } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Debate() {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [numParticipants, setNumParticipants] = useState("3");
  const [currentResult, setCurrentResult] = useState<any>(null);

  const conductMutation = trpc.debate.conduct.useMutation({
    onSuccess: (data) => {
      setCurrentResult(data);
      toast.success("Debate completed successfully!");
    },
    onError: (error) => {
      toast.error(`Debate failed: ${error.message}`);
    },
  });

  const { data: sessions, isLoading: sessionsLoading } = trpc.debate.list.useQuery();

  const handleConduct = () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    conductMutation.mutate({
      question,
      context: context || undefined,
      numParticipants: parseInt(numParticipants),
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Multi-LLM Debate Engine</h1>
        <p className="text-muted-foreground mt-2">
          Get expert perspectives from multiple AI personas on complex chemistry questions
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>
            Multiple AI experts with different backgrounds will discuss your question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="e.g., What are the key considerations when formulating a UV-curable coating for outdoor applications?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Provide any relevant context, formulation details, or constraints..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Number of Participants</Label>
            <Select value={numParticipants} onValueChange={setNumParticipants}>
              <SelectTrigger id="participants">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Experts</SelectItem>
                <SelectItem value="3">3 Experts</SelectItem>
                <SelectItem value="4">4 Experts</SelectItem>
                <SelectItem value="5">5 Experts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleConduct}
            disabled={conductMutation.isPending}
            className="w-full"
          >
            {conductMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conducting Debate...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Debate
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {currentResult && (
        <Card>
          <CardHeader>
            <CardTitle>Debate Results</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                {currentResult.participants.length} Participants
              </Badge>
              <Badge variant="secondary">
                Confidence: {(currentResult.confidenceScore * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Synthesis */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Synthesized Answer</h3>
              <div className="prose prose-sm max-w-none">
                <Streamdown>{currentResult.synthesis}</Streamdown>
              </div>
            </div>

            {/* Key Insights */}
            {currentResult.keyInsights && currentResult.keyInsights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Key Insights</h3>
                <ul className="list-disc list-inside space-y-1">
                  {currentResult.keyInsights.map((insight: string, idx: number) => (
                    <li key={idx} className="text-sm">{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {currentResult.recommendations && currentResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1">
                  {currentResult.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disagreements */}
            {currentResult.disagreements && currentResult.disagreements.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Areas of Disagreement</h3>
                <ul className="list-disc list-inside space-y-1">
                  {currentResult.disagreements.map((dis: string, idx: number) => (
                    <li key={idx} className="text-sm text-amber-600">{dis}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Individual Perspectives */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Individual Expert Perspectives</h3>
              {currentResult.participants.map((participant: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">{participant.persona}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Initial Response:</h4>
                      <div className="text-sm prose prose-sm max-w-none">
                        <Streamdown>{participant.initialResponse}</Streamdown>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Critique of Others:</h4>
                      <div className="text-sm prose prose-sm max-w-none">
                        <Streamdown>{participant.critique}</Streamdown>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Final Position:</h4>
                      <div className="text-sm prose prose-sm max-w-none">
                        <Streamdown>{participant.finalPosition}</Streamdown>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Debates</CardTitle>
          <CardDescription>Your debate history</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session: any) => (
                <Card key={session.id} className="cursor-pointer hover:bg-accent" onClick={() => setCurrentResult(session.result)}>
                  <CardContent className="py-3">
                    <p className="text-sm font-medium line-clamp-2">{session.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(session.created_at).toLocaleString()} • {session.num_participants} participants
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No previous debates yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
