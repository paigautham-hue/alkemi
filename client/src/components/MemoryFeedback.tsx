import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MemoryFeedbackProps {
  memoryId: number;
  context?: string; // e.g., "prediction", "debate", "patent_analysis"
  compact?: boolean;
  onFeedbackSubmitted?: (rating: "helpful" | "not_helpful", newConfidence?: number) => void;
}

export function MemoryFeedback({ memoryId, context, compact = false, onFeedbackSubmitted }: MemoryFeedbackProps) {
  const [optimisticRating, setOptimisticRating] = useState<"helpful" | "not_helpful" | null>(null);
  
  const { data: feedbackData, isLoading } = trpc.memory.getFeedback.useQuery(
    { memoryId },
    { enabled: memoryId > 0 }
  );

  const submitFeedbackMutation = trpc.memory.submitFeedback.useMutation({
    onMutate: (variables) => {
      setOptimisticRating(variables.rating);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(
          variables.rating === "helpful" 
            ? "Thanks! This memory will be prioritized." 
            : "Thanks! We'll improve memory quality."
        );
        onFeedbackSubmitted?.(variables.rating, result.newConfidence);
      }
    },
    onError: () => {
      setOptimisticRating(null);
      toast.error("Failed to submit feedback");
    },
  });

  const currentRating = optimisticRating || feedbackData?.userFeedback;
  const stats = feedbackData?.stats;

  const handleFeedback = (rating: "helpful" | "not_helpful") => {
    if (submitFeedbackMutation.isPending) return;
    submitFeedbackMutation.mutate({ memoryId, rating, context });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${currentRating === "helpful" ? "text-green-600 bg-green-100" : "text-muted-foreground hover:text-green-600"}`}
                onClick={() => handleFeedback("helpful")}
                disabled={submitFeedbackMutation.isPending}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Helpful ({stats?.helpfulCount || 0})</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${currentRating === "not_helpful" ? "text-red-600 bg-red-100" : "text-muted-foreground hover:text-red-600"}`}
                onClick={() => handleFeedback("not_helpful")}
                disabled={submitFeedbackMutation.isPending}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Not helpful ({stats?.notHelpfulCount || 0})</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Was this helpful?</span>
      <div className="flex items-center gap-1">
        <Button
          variant={currentRating === "helpful" ? "default" : "outline"}
          size="sm"
          className={`h-7 px-2 ${currentRating === "helpful" ? "bg-green-600 hover:bg-green-700" : ""}`}
          onClick={() => handleFeedback("helpful")}
          disabled={submitFeedbackMutation.isPending}
        >
          <ThumbsUp className="h-3 w-3 mr-1" />
          {stats?.helpfulCount || 0}
        </Button>
        
        <Button
          variant={currentRating === "not_helpful" ? "default" : "outline"}
          size="sm"
          className={`h-7 px-2 ${currentRating === "not_helpful" ? "bg-red-600 hover:bg-red-700" : ""}`}
          onClick={() => handleFeedback("not_helpful")}
          disabled={submitFeedbackMutation.isPending}
        >
          <ThumbsDown className="h-3 w-3 mr-1" />
          {stats?.notHelpfulCount || 0}
        </Button>
      </div>
    </div>
  );
}

/**
 * Component to display memory sources with feedback buttons
 */
interface MemorySourcesDisplayProps {
  memorySources: Array<{
    id: number;
    fact: string;
    confidence: number;
    category?: string;
  }>;
  context: string;
}

export function MemorySourcesDisplay({ memorySources, context }: MemorySourcesDisplayProps) {
  if (!memorySources || memorySources.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        <span className="text-primary">💡</span>
        Knowledge Sources ({memorySources.length})
      </h4>
      <div className="space-y-2">
        {memorySources.map((memory) => (
          <div 
            key={memory.id} 
            className="flex items-start justify-between gap-2 p-2 bg-background rounded border text-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground line-clamp-2">{memory.fact}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {(memory.confidence * 100).toFixed(0)}% confidence
                </span>
                {memory.category && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    {memory.category.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
            <MemoryFeedback memoryId={memory.id} context={context} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
