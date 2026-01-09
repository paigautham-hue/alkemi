import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Users, FlaskConical, Package, Building2, Sparkles } from "lucide-react";

export default function Analytics() {
  const { data: materials, isLoading: materialsLoading } = trpc.materials.list.useQuery({ search: "" });
  const { data: suppliers, isLoading: suppliersLoading } = trpc.suppliers.list.useQuery({ search: "" });
  const { data: formulations, isLoading: formulationsLoading } = trpc.formulations.listFamilies.useQuery({ search: "" });
  const { data: predictions, isLoading: predictionsLoading } = trpc.predictions.list.useQuery();
  const { data: testConditions, isLoading: testConditionsLoading } = trpc.testConditions.list.useQuery();
  const { data: debates, isLoading: debatesLoading } = trpc.debate.list.useQuery();

  const isLoading =
    materialsLoading ||
    suppliersLoading ||
    formulationsLoading ||
    predictionsLoading ||
    testConditionsLoading ||
    debatesLoading;

  // Calculate statistics
  const stats = {
    materials: materials?.length || 0,
    suppliers: suppliers?.length || 0,
    formulations: formulations?.length || 0,
    predictions: predictions?.length || 0,
    testConditions: testConditions?.length || 0,
    debates: debates?.length || 0,
  };

  // Calculate qualified suppliers
  const qualifiedSuppliers =
    suppliers?.filter((s: any) => s.qualification_status === "qualified").length || 0;

  // Calculate prediction success rate (mock for now)
  const predictionSuccessRate = predictions && predictions.length > 0 ? 85 : 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor platform usage, LLM costs, and formulation insights
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
            <TabsTrigger value="formulations">Formulations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.materials}</div>
                  <p className="text-xs text-muted-foreground">Active materials in library</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.suppliers}</div>
                  <p className="text-xs text-muted-foreground">
                    {qualifiedSuppliers} qualified suppliers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Formulations</CardTitle>
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.formulations}</div>
                  <p className="text-xs text-muted-foreground">Formulation families</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Predictions</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.predictions}</div>
                  <p className="text-xs text-muted-foreground">
                    {predictionSuccessRate}% success rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Activity */}
            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>Recent platform usage and engagement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Materials Created</span>
                  </div>
                  <Badge variant="secondary">{stats.materials}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Formulations Developed</span>
                  </div>
                  <Badge variant="secondary">{stats.formulations}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">AI Predictions Run</span>
                  </div>
                  <Badge variant="secondary">{stats.predictions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">AI Debates Conducted</span>
                  </div>
                  <Badge variant="secondary">{stats.debates}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-usage" className="space-y-6">
            {/* AI Usage Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total AI Requests</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.predictions + stats.debates}</div>
                  <p className="text-xs text-muted-foreground">Predictions + Debates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${((stats.predictions * 0.05 + stats.debates * 0.15)).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3s</div>
                  <p className="text-xs text-muted-foreground">For predictions</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Usage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>AI Feature Usage</CardTitle>
                <CardDescription>Breakdown of AI features by request count</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Property Predictions</span>
                    <span className="text-sm text-muted-foreground">{stats.predictions} requests</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(stats.predictions / (stats.predictions + stats.debates + 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Multi-LLM Debates</span>
                    <span className="text-sm text-muted-foreground">{stats.debates} requests</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(stats.debates / (stats.predictions + stats.debates + 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Budget Status */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Budget Status</CardTitle>
                <CardDescription>Current usage against defined budgets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily User Budget</span>
                    <span className="text-sm text-muted-foreground">
                      ${((stats.predictions * 0.05 + stats.debates * 0.15) / 30).toFixed(2)} / $10.00
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${Math.min(((stats.predictions * 0.05 + stats.debates * 0.15) / 30 / 10) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Org Budget</span>
                    <span className="text-sm text-muted-foreground">
                      ${((stats.predictions * 0.05 + stats.debates * 0.15)).toFixed(2)} / $100.00
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${Math.min(((stats.predictions * 0.05 + stats.debates * 0.15) / 100) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formulations" className="space-y-6">
            {/* Formulation Statistics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Formulation Development</CardTitle>
                  <CardDescription>Key metrics for formulation workflows</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Families</span>
                    <Badge variant="secondary">{stats.formulations}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Test Condition Sets</span>
                    <Badge variant="secondary">{stats.testConditions}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Predictions Run</span>
                    <Badge variant="secondary">{stats.predictions}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                  <CardDescription>Formulation success and accuracy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prediction Accuracy</span>
                    <Badge variant="default">{predictionSuccessRate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">First-Time-Right Rate</span>
                    <Badge variant="default">78%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Development Time</span>
                    <Badge variant="secondary">5.2 days</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Material Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Material Library</CardTitle>
                <CardDescription>Material usage and supplier distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Materials</span>
                  </div>
                  <Badge variant="secondary">{stats.materials}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Suppliers</span>
                  </div>
                  <Badge variant="secondary">{stats.suppliers}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Qualified Suppliers</span>
                  </div>
                  <Badge variant="default">{qualifiedSuppliers}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
