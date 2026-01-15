import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { FormulationComparison } from "@/components/FormulationComparison";
import { VersionTree } from "@/components/VersionTree";
import { toast } from "sonner";
import {
  ArrowLeft,
  GitCompare,
  Plus,
  Calendar,
  User,
  FileText,
  Beaker,
  RotateCcw,
  List,
  GitBranch,
} from "lucide-react";
import { Link } from "wouter";

export default function FormulationDetail() {
  const [, params] = useRoute("/formulations/:id");
  const familyId = params?.id || "";
  const [showComparison, setShowComparison] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data: family, isLoading: familyLoading } = trpc.formulations.getFamilyById.useQuery(
    { id: familyId },
    { enabled: !!familyId }
  );

  const { data: versions, isLoading: versionsLoading } = trpc.formulations.listVersions.useQuery(
    { familyId },
    { enabled: !!familyId }
  );

  const utils = trpc.useUtils();
  const restoreMutation = trpc.formulations.restoreVersion.useMutation({
    onSuccess: (data) => {
      toast.success(data.message, {
        description: `New draft version ${data.versionNumber} created`,
        action: {
          label: "View",
          onClick: () => setLocation(`/formulations/${familyId}/versions/${data.id}`),
        },
      });
      utils.formulations.listVersions.invalidate({ familyId });
      setRestoreDialogOpen(false);
      setVersionToRestore(null);
    },
    onError: (error) => {
      toast.error("Failed to restore version", {
        description: error.message,
      });
    },
  });

  const handleRestoreClick = (versionId: string) => {
    setVersionToRestore(versionId);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = () => {
    if (versionToRestore) {
      restoreMutation.mutate({ versionId: versionToRestore });
    }
  };

  const handleVersionClick = (versionId: string) => {
    setLocation(`/formulations/${familyId}/versions/${versionId}`);
  };

  const isLoading = familyLoading || versionsLoading;

  if (showComparison) {
    return (
      <DashboardLayout>
        <AnimatedPage>
          <FormulationComparison
            familyId={familyId}
            onClose={() => setShowComparison(false)}
          />
        </AnimatedPage>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="container py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Link href="/formulations">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  {family?.name || "Loading..."}
                </h1>
              </div>
              {family?.description && (
                <p className="text-muted-foreground ml-24">{family.description}</p>
              )}
            </div>
            <Button variant="gradient" onClick={() => setShowComparison(true)}>
              <GitCompare className="mr-2 h-4 w-4" />
              Compare Versions
            </Button>
          </div>

          {/* Version History */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Version History</CardTitle>
                  <CardDescription>
                    {versions?.length || 0} version{versions?.length !== 1 ? "s" : ""} in this family
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List View
                  </TabsTrigger>
                  <TabsTrigger value="tree" className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Tree View
                  </TabsTrigger>
                </TabsList>

                {/* List View */}
                <TabsContent value="list" className="mt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : versions && versions.length > 0 ? (
                    <div className="space-y-3">
                      {versions.map((version, index) => (
                        <div
                          key={version.id}
                          className="glass border rounded-lg p-4 hover-lift transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-semibold">{version.versionNumber}</span>
                                <Badge variant="secondary">{version.status}</Badge>
                                {version.branchType && (
                                  <Badge variant="outline" className="text-xs">
                                    {version.branchType}
                                  </Badge>
                                )}
                                {index === 0 && (
                                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                    Latest
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>Created by {version.createdBy}</span>
                                </div>
                              </div>
                              {version.notes && (
                                <div className="flex items-start gap-2 text-sm">
                                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <p className="text-muted-foreground">{version.notes}</p>
                                </div>
                              )}
                              {version.changeReason && (
                                <div className="text-sm bg-muted/50 rounded-md p-2">
                                  <span className="font-medium">Change Reason:</span> {version.changeReason}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRestoreClick(version.id)}
                                disabled={restoreMutation.isPending}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setLocation(`/formulations/${familyId}/versions/${version.id}`)}
                              >
                                <Beaker className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No versions found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create the first version to get started
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Tree View */}
                <TabsContent value="tree" className="mt-0">
                  {/* Branch Filter */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter by branch:</span>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Branches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        <SelectItem value="revision">Revision</SelectItem>
                        <SelectItem value="variant">Variant</SelectItem>
                        <SelectItem value="cost_reduction">Cost Reduction</SelectItem>
                        <SelectItem value="customer_specific">Customer Specific</SelectItem>
                        <SelectItem value="experimental">Experimental</SelectItem>
                      </SelectContent>
                    </Select>
                    {branchFilter !== "all" && (
                      <Badge variant="secondary">
                        {versions?.filter((v) => v.branchType === branchFilter).length || 0} version(s)
                      </Badge>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : versions && versions.length > 0 ? (
                    <VersionTree
                      versions={
                        branchFilter === "all"
                          ? versions
                          : versions.filter((v) => v.branchType === branchFilter)
                      }
                      onVersionClick={handleVersionClick}
                      highlightVersionId={versions[0]?.id}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No versions found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create the first version to get started
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Restore Confirmation Dialog */}
        <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore This Version?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new draft version based on the selected version. The original version will remain unchanged.
                You can edit the new draft and submit it for approval when ready.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestoreConfirm} disabled={restoreMutation.isPending}>
                {restoreMutation.isPending ? "Restoring..." : "Restore Version"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AnimatedPage>
    </DashboardLayout>
  );
}
