import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Activity, Target, FlaskConical, Microscope } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState(30);
  
  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery();
  const { data: predictionAccuracy } = trpc.analytics.predictionAccuracy.useQuery({ days: timeRange });
  const { data: trialSuccess } = trpc.analytics.trialSuccess.useQuery({ days: timeRange });
  const { data: formulationTimeline } = trpc.analytics.formulationTimeline.useQuery({ days: timeRange });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Performance metrics and insights across your formulation workspace
            </p>
          </div>
          <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {summaryLoading ? (
          <div className="text-center py-8">Loading summary...</div>
        ) : summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Formulations</CardTitle>
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalFormulations}</div>
                  <p className="text-xs text-muted-foreground">
                    +{summary.recentActivity.formulationsThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Materials Library</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalMaterials}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.totalSuppliers} qualified suppliers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Predictions Made</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalPredictions}</div>
                  <p className="text-xs text-muted-foreground">
                    +{summary.recentActivity.predictionsThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
                  {summary.averagePredictionAccuracy >= 80 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-yellow-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.averagePredictionAccuracy.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {summary.totalTrials} trials
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Prediction Accuracy Trend</CardTitle>
                  <CardDescription>
                    Tracking how well predictions match experimental results over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {predictionAccuracy && predictionAccuracy.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={predictionAccuracy}>
                        <defs>
                          <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="accuracyRate" 
                          stroke="#10b981" 
                          fillOpacity={1}
                          fill="url(#colorAccuracy)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No prediction accuracy data available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trial Success Rate</CardTitle>
                  <CardDescription>
                    Percentage of trials meeting accuracy targets (&lt;20% error)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trialSuccess && trialSuccess.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trialSuccess}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          labelFormatter={formatDate}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="successRate" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Success Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No trial data available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Formulation Development</CardTitle>
                  <CardDescription>
                    New formulations and revisions created over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formulationTimeline && formulationTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formulationTimeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          labelFormatter={formatDate}
                        />
                        <Legend />
                        <Bar dataKey="created" stackId="a" fill="#8b5cf6" name="Created" />
                        <Bar dataKey="revised" stackId="a" fill="#ec4899" name="Revised" />
                        <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No formulation data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Summary</CardTitle>
                <CardDescription>
                  Key metrics from the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <FlaskConical className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">{summary.recentActivity.formulationsThisMonth}</div>
                      <div className="text-sm text-muted-foreground">New Formulations</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{summary.recentActivity.predictionsThisMonth}</div>
                      <div className="text-sm text-muted-foreground">Predictions Run</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Microscope className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{summary.recentActivity.trialsThisMonth}</div>
                      <div className="text-sm text-muted-foreground">Trials Conducted</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
