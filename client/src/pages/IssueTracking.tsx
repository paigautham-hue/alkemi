import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp,
  Lightbulb,
  Search,
} from "lucide-react";

export default function IssueTracking() {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: issues = [] } = trpc.issues.list.useQuery({});
  const { data: selectedIssueData } = trpc.issues.get.useQuery(
    { id: selectedIssue! },
    { enabled: !!selectedIssue }
  );
  const { data: improvementActions = [] } = trpc.improvementActions.list.useQuery({});

  const createIssueMutation = trpc.issues.create.useMutation({
    onSuccess: () => {
      toast.success("Issue created successfully");
      utils.issues.list.invalidate();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create issue: ${error.message}`);
    },
  });

  const analyzeRootCauseMutation = trpc.issues.analyzeRootCause.useMutation({
    onSuccess: () => {
      toast.success("Root cause analysis complete");
      utils.issues.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const generateRecommendationsMutation = trpc.issues.generateRecommendations.useMutation({
    onSuccess: () => {
      toast.success("Improvement recommendations generated");
      utils.issues.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to generate recommendations: ${error.message}`);
    },
  });

  const createActionMutation = trpc.improvementActions.create.useMutation({
    onSuccess: () => {
      toast.success("Improvement action created");
      utils.improvementActions.list.invalidate();
      setIsActionDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create action: ${error.message}`);
    },
  });

  const handleCreateIssue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createIssueMutation.mutate({
      issueType: formData.get("issueType") as any,
      severity: formData.get("severity") as any,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      costImpact: formData.get("costImpact")
        ? parseFloat(formData.get("costImpact") as string)
        : undefined,
    });
  };

  const handleCreateAction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createActionMutation.mutate({
      issueId: selectedIssue || undefined,
      actionType: formData.get("actionType") as any,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as any,
      expectedImpact: formData.get("expectedImpact") as string || undefined,
      estimatedCost: formData.get("estimatedCost")
        ? parseFloat(formData.get("estimatedCost") as string)
        : undefined,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "investigating":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "recurring":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Issue Tracking & Improvement</h1>
            <p className="text-muted-foreground mt-1">
              Track quality issues, analyze root causes, and drive continuous improvement
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  New Improvement Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Improvement Action</DialogTitle>
                  <DialogDescription>
                    Define an action to prevent future issues or improve processes
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAction} className="space-y-4">
                  <div>
                    <Label htmlFor="actionType">Action Type *</Label>
                    <Select name="actionType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="process_change">Process Change</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="equipment_upgrade">Equipment Upgrade</SelectItem>
                        <SelectItem value="supplier_change">Supplier Change</SelectItem>
                        <SelectItem value="formulation_modification">
                          Formulation Modification
                        </SelectItem>
                        <SelectItem value="procedure_update">Procedure Update</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Brief description of the action"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Detailed description of the improvement action"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority *</Label>
                      <Select name="priority" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                      <Input
                        id="estimatedCost"
                        name="estimatedCost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expectedImpact">Expected Impact</Label>
                    <Textarea
                      id="expectedImpact"
                      name="expectedImpact"
                      placeholder="What outcomes do you expect from this action?"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsActionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createActionMutation.isPending}>
                      {createActionMutation.isPending ? "Creating..." : "Create Action"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Report New Issue</DialogTitle>
                  <DialogDescription>
                    Document a quality issue, process failure, or other problem
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateIssue} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="issueType">Issue Type *</Label>
                      <Select name="issueType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quality_defect">Quality Defect</SelectItem>
                          <SelectItem value="process_failure">Process Failure</SelectItem>
                          <SelectItem value="scale_up_issue">Scale-Up Issue</SelectItem>
                          <SelectItem value="supplier_issue">Supplier Issue</SelectItem>
                          <SelectItem value="equipment_malfunction">
                            Equipment Malfunction
                          </SelectItem>
                          <SelectItem value="safety_incident">Safety Incident</SelectItem>
                          <SelectItem value="compliance_violation">
                            Compliance Violation
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity *</Label>
                      <Select name="severity" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Brief description of the issue"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Detailed description of the issue, including what happened, when, and any relevant context"
                      rows={5}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="costImpact">Cost Impact ($)</Label>
                    <Input
                      id="costImpact"
                      name="costImpact"
                      type="number"
                      step="0.01"
                      placeholder="Estimated financial impact"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createIssueMutation.isPending}>
                      {createIssueMutation.isPending ? "Creating..." : "Report Issue"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Issues List */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Issues</CardTitle>
                <CardDescription>{issues.length} total issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {issues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No issues reported</p>
                      <p className="text-sm">Click "Report Issue" to get started</p>
                    </div>
                  ) : (
                    issues.map((issue: any) => (
                      <div
                        key={issue.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                          selectedIssue === issue.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setSelectedIssue(issue.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{issue.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {issue.issueType.replace(/_/g, " ")}
                            </p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(issue.severity)}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getStatusColor(issue.status)}>
                            {issue.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(issue.reportedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Details */}
          <div className="col-span-8">
            {!selectedIssue ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select an issue to view details and analysis</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedIssueData?.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {selectedIssueData?.issueType.replace(/_/g, " ")} •{" "}
                        {new Date(selectedIssueData?.reportedAt || "").toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          analyzeRootCauseMutation.mutate({ issueId: selectedIssue })
                        }
                        disabled={analyzeRootCauseMutation.isPending}
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        {analyzeRootCauseMutation.isPending
                          ? "Analyzing..."
                          : "Analyze Root Cause"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          generateRecommendationsMutation.mutate({ issueId: selectedIssue })
                        }
                        disabled={generateRecommendationsMutation.isPending}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {generateRecommendationsMutation.isPending
                          ? "Generating..."
                          : "Generate Recommendations"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="actions">Improvement Actions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedIssueData?.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Severity</h4>
                          <Badge className={getSeverityColor(selectedIssueData?.severity || "")}>
                            {selectedIssueData?.severity}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Status</h4>
                          <Badge className={getStatusColor(selectedIssueData?.status || "")}>
                            {selectedIssueData?.status}
                          </Badge>
                        </div>
                      </div>
                      {selectedIssueData?.costImpact && (
                        <div>
                          <h4 className="font-semibold mb-2">Cost Impact</h4>
                          <p className="text-sm">
                            ${parseFloat(selectedIssueData.costImpact).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedIssueData?.rootCause && (
                        <div>
                          <h4 className="font-semibold mb-2">Root Cause</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedIssueData.rootCause}
                          </p>
                        </div>
                      )}
                      {selectedIssueData?.correctiveAction && (
                        <div>
                          <h4 className="font-semibold mb-2">Corrective Action</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedIssueData.correctiveAction}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="analysis" className="space-y-4">
                      {!selectedIssueData?.analyses || selectedIssueData.analyses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No analysis available</p>
                          <p className="text-sm">
                            Click "Analyze Root Cause" to generate AI-powered analysis
                          </p>
                        </div>
                      ) : (
                        selectedIssueData.analyses.map((analysis: any) => (
                          <div key={analysis.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge>{analysis.analysisType.replace(/_/g, " ")}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(analysis.analyzedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Findings</h4>
                                <p className="text-sm text-muted-foreground">
                                  {analysis.findings}
                                </p>
                              </div>
                              {analysis.recommendations &&
                                analysis.recommendations.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-1">
                                      Recommendations
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                      {analysis.recommendations.map((rec: string, idx: number) => (
                                        <li key={idx}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              {analysis.confidence && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Confidence</h4>
                                  <p className="text-sm">
                                    {(parseFloat(analysis.confidence) * 100).toFixed(0)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                    <TabsContent value="actions">
                      <div className="space-y-3">
                        {improvementActions
                          .filter((action: any) => action.issueId === selectedIssue)
                          .map((action: any) => (
                            <div key={action.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">{action.title}</h4>
                                <Badge>{action.priority}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {action.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{action.actionType.replace(/_/g, " ")}</span>
                                <span>•</span>
                                <Badge variant="secondary">{action.status}</Badge>
                                {action.estimatedCost && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Est. ${parseFloat(action.estimatedCost).toLocaleString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        {improvementActions.filter((action: any) => action.issueId === selectedIssue)
                          .length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No improvement actions yet</p>
                            <p className="text-sm">
                              Click "Generate Recommendations" to get AI-powered suggestions
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
