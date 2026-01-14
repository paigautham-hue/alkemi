import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, Beaker, FileText, Target } from "lucide-react";

interface AnalysisStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  estimatedSeconds: number;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: "text_analysis",
    label: "Technical Analysis",
    description: "Extracting technical parameters from marketing claims",
    icon: <Beaker className="h-4 w-4" />,
    estimatedSeconds: 15,
  },
  {
    id: "json_structuring",
    label: "Data Structuring",
    description: "Converting analysis into structured format",
    icon: <FileText className="h-4 w-4" />,
    estimatedSeconds: 10,
  },
  {
    id: "formulation_strategy",
    label: "Formulation Strategy",
    description: "Generating recommended formulation approach",
    icon: <Target className="h-4 w-4" />,
    estimatedSeconds: 15,
  },
  {
    id: "tpp_generation",
    label: "Target Product Profile",
    description: "Creating comprehensive product specification",
    icon: <Target className="h-4 w-4" />,
    estimatedSeconds: 15,
  },
  {
    id: "saving",
    label: "Saving Results",
    description: "Storing analysis in database",
    icon: <CheckCircle2 className="h-4 w-4" />,
    estimatedSeconds: 5,
  },
];

const TOTAL_ESTIMATED_SECONDS = ANALYSIS_STEPS.reduce((sum, step) => sum + step.estimatedSeconds, 0);

interface AnalysisProgressIndicatorProps {
  isAnalyzing: boolean;
  productName?: string;
}

export function AnalysisProgressIndicator({ isAnalyzing, productName }: AnalysisProgressIndicatorProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setElapsedSeconds(0);
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        
        // Calculate which step we should be on based on elapsed time
        let cumulativeTime = 0;
        for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
          cumulativeTime += ANALYSIS_STEPS[i].estimatedSeconds;
          if (next < cumulativeTime) {
            setCurrentStepIndex(i);
            break;
          }
        }
        
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const progressPercent = Math.min((elapsedSeconds / TOTAL_ESTIMATED_SECONDS) * 100, 95);
  const remainingSeconds = Math.max(TOTAL_ESTIMATED_SECONDS - elapsedSeconds, 0);
  const currentStep = ANALYSIS_STEPS[currentStepIndex];

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Analyzing {productName || "Product"}
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {remainingSeconds > 0 ? `~${remainingSeconds}s remaining` : "Finishing..."}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current Step */}
        <div className="bg-background rounded-lg p-3 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              {currentStep.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{currentStep.label}</p>
              <p className="text-xs text-muted-foreground">{currentStep.description}</p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        </div>

        {/* Step Progress */}
        <div className="grid grid-cols-5 gap-2">
          {ANALYSIS_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-1 p-2 rounded ${
                index < currentStepIndex
                  ? "bg-green-100 dark:bg-green-900/20"
                  : index === currentStepIndex
                  ? "bg-primary/10"
                  : "bg-muted/50"
              }`}
            >
              <div
                className={`p-1.5 rounded-full ${
                  index < currentStepIndex
                    ? "bg-green-500 text-white"
                    : index === currentStepIndex
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : index === currentStepIndex ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </div>
              <span className="text-[10px] text-center leading-tight">{step.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for analysis results
 */
export function AnalysisResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Technical Parameters Skeleton */}
      <div>
        <Skeleton className="h-6 w-48 mb-3" />
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Test Methods Skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-48" />
          ))}
        </div>
      </div>

      {/* Critical Properties Skeleton */}
      <div>
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for charts
 */
export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className={`w-full`} style={{ height: `${height}px` }} />
    </div>
  );
}
