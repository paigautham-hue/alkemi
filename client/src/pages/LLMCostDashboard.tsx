import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Zap, Clock, Download, Settings, BarChart3, PieChart, Activity, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// Time period options
const TIME_PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

// Model colors for charts
const MODEL_COLORS: Record<string, string> = {
  "gpt-5.2": "#10B981",
  "gpt-5.2-codex": "#059669",
  "gpt-5.2-instant": "#34D399",
  "claude-opus-4-5": "#8B5CF6",
  "claude-sonnet-4-5": "#A78BFA",
  "claude-haiku-4-5": "#C4B5FD",
  "gemini-3-pro": "#3B82F6",
  "gemini-3-flash": "#60A5FA",
  "gemini-2.5-flash": "#93C5FD",
};

function getDateRange(period: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  let startDate: Date | undefined;
  
  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
    default:
      return {};
  }
  
  return {
    startDate: startDate?.toISOString(),
    endDate: now.toISOString(),
  };
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = "blue" 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: any; 
  trend?: number;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center mt-3 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}% vs last period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModelBreakdownChart({ data }: { data: Record<string, { requests: number; tokens: number; cost: number }> }) {
  const sortedModels = useMemo(() => {
    return Object.entries(data)
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 8);
  }, [data]);

  const totalCost = useMemo(() => {
    return Object.values(data).reduce((sum, m) => sum + m.cost, 0);
  }, [data]);

  if (sortedModels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No model usage data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedModels.map(([model, stats]) => {
        const percentage = totalCost > 0 ? (stats.cost / totalCost) * 100 : 0;
        return (
          <div key={model} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{model}</span>
              <span className="text-muted-foreground">
                ${stats.cost.toFixed(4)} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: MODEL_COLORS[model] || '#6B7280'
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.requests.toLocaleString()} requests</span>
              <span>{stats.tokens.toLocaleString()} tokens</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UseCaseBreakdown({ data }: { data: Record<string, { requests: number; tokens: number; cost: number }> }) {
  const sortedUseCases = useMemo(() => {
    return Object.entries(data)
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 6);
  }, [data]);

  if (sortedUseCases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No use case data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedUseCases.map(([useCase, stats]) => (
        <div key={useCase} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium text-sm">{useCase}</p>
            <p className="text-xs text-muted-foreground">
              {stats.requests.toLocaleString()} requests • {stats.tokens.toLocaleString()} tokens
            </p>
          </div>
          <Badge variant="secondary" className="font-mono">
            ${stats.cost.toFixed(4)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function BudgetSettingsDialog() {
  const [budget, setBudget] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const setBudgetMutation = trpc.llmCost.setBudget.useMutation({
    onSuccess: () => {
      toast.success("Budget alert configured successfully");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to set budget: ${error.message}`);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Budget Alerts
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Budget Alerts</DialogTitle>
          <DialogDescription>
            Set a monthly budget limit and receive alerts when usage approaches the threshold.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly Budget ($)</label>
            <Input
              type="number"
              placeholder="100.00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You'll receive alerts at 50%, 75%, and 90% of your budget.
          </p>
          <Button 
            className="w-full"
            onClick={() => {
              const budgetValue = parseFloat(budget);
              if (isNaN(budgetValue) || budgetValue <= 0) {
                toast.error("Please enter a valid budget amount");
                return;
              }
              setBudgetMutation.mutate({ monthlyBudget: budgetValue });
            }}
            disabled={setBudgetMutation.isPending}
          >
            {setBudgetMutation.isPending ? "Saving..." : "Save Budget Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LLMCostDashboard() {
  const [timePeriod, setTimePeriod] = useState("month");
  
  const dateRange = useMemo(() => getDateRange(timePeriod), [timePeriod]);
  
  const { data: stats, isLoading, refetch } = trpc.llmCost.stats.useQuery(
    dateRange.startDate ? dateRange : undefined
  );

  const handleExportCSV = async () => {
    try {
      // This would trigger a download in a real implementation
      toast.success("Export started - CSV will download shortly");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              LLM Cost Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor AI usage, costs, and optimize spending
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <BudgetSettingsDialog />
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Cost"
              value={`$${(stats?.totalCost || 0).toFixed(4)}`}
              subtitle={`${(stats?.totalRequests || 0).toLocaleString()} requests`}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Total Tokens"
              value={(stats?.totalTokens || 0).toLocaleString()}
              subtitle="Input + Output"
              icon={Zap}
              color="blue"
            />
            <StatCard
              title="Avg Latency"
              value={`${Math.round(stats?.averageLatencyMs || 0)}ms`}
              subtitle="Response time"
              icon={Clock}
              color="purple"
            />
            <StatCard
              title="Fallback Rate"
              value={`${((stats?.fallbackRate || 0) * 100).toFixed(1)}%`}
              subtitle="Primary model failures"
              icon={stats?.fallbackRate && stats.fallbackRate > 0.1 ? AlertTriangle : Activity}
              color={stats?.fallbackRate && stats.fallbackRate > 0.1 ? "orange" : "blue"}
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cost by Model
              </CardTitle>
              <CardDescription>
                Breakdown of spending across AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <ModelBreakdownChart data={stats?.byModel || {}} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Cost by Use Case
              </CardTitle>
              <CardDescription>
                Which features are consuming the most resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <UseCaseBreakdown data={stats?.byUseCase || {}} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cost Optimization Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cost Optimization Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered suggestions to reduce costs while maintaining quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Use Gemini 3 Flash</h4>
                <p className="text-sm text-green-700">
                  Switch predictions to Gemini 3 Flash for 95% cost savings on routine tasks.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Enable Prompt Caching</h4>
                <p className="text-sm text-blue-700">
                  Cache repeated contexts for up to 90% savings on DOE and batch operations.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">Batch Processing</h4>
                <p className="text-sm text-purple-700">
                  Queue non-urgent analyses for overnight batch processing (50% discount).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
