import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Equal,
  FileDown,
  GitCompare,
  Calendar,
  User,
  AlertCircle,
  Edit2,
  Save,
} from "lucide-react";

interface FormulationComparisonProps {
  familyId: string;
  onClose?: () => void;
}

export function FormulationComparison({ familyId, onClose }: FormulationComparisonProps) {
  const [baseVersionId, setBaseVersionId] = useState<string>("");
  const [targetVersionId, setTargetVersionId] = useState<string>("");
  const [editedComponents, setEditedComponents] = useState<Record<string, number>>({});
  const [, setLocation] = useLocation();

  // Fetch all versions for this family
  const { data: versions, isLoading: versionsLoading } = trpc.formulations.listVersions.useQuery({
    familyId,
  });

  // Fetch comparison data
  const { data: comparison, isLoading: comparisonLoading } = trpc.formulations.compare.useQuery(
    {
      baseVersionId,
      targetVersionId,
    },
    {
      enabled: !!baseVersionId && !!targetVersionId && baseVersionId !== targetVersionId,
    }
  );

  // Create new version from edited components
  const createVersionMutation = trpc.formulations.createVersion.useMutation({
    onSuccess: async (data) => {
      // After version is created, add all components
      for (const comp of components) {
        await trpc.formulations.addComponent.useMutation().mutateAsync({
          versionId: data.id,
          materialId: comp.materialId,
          percentage: comp.percentage.toString(),
          role: comp.role,
        });
      }
      
      toast.success("New version created!", {
        description: `Version ${newVersionNumber} created with your changes`,
        action: {
          label: "View",
          onClick: () => setLocation(`/formulations/${familyId}/versions/${data.id}`),
        },
      });
      setEditedComponents({});
      if (onClose) onClose();
    },
    onError: (error) => {
      toast.error("Failed to create version", {
        description: error.message,
      });
    },
  });

  let components: Array<{ materialId: string; percentage: number; role: "component" }>  = [];
  let newVersionNumber = "";

  const handleCreateNewVersion = async () => {
    if (!comparison || Object.keys(editedComponents).length === 0) return;

    // Get the latest version number to generate new version
    const versionNumbers = versions?.map(v => {
      const match = v.versionNumber.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }) || [];
    const maxVersion = Math.max(...versionNumbers, 0);
    newVersionNumber = `v${maxVersion + 1}.0`;

    // Prepare components with edited values
    components = comparison.componentComparisons
      .filter(comp => comp.targetPercentage !== null)
      .map(comp => ({
        materialId: comp.materialId,
        percentage: editedComponents[comp.materialId] ?? parseFloat(comp.targetPercentage!),
        role: "component" as const,
      }));

    createVersionMutation.mutate({
      familyId,
      versionNumber: newVersionNumber,
      parentVersionId: targetVersionId,
      branchType: "revision",
      notes: `Created from comparison with ${Object.keys(editedComponents).length} edited component(s)`,
      changeReason: `Modified ${Object.keys(editedComponents).length} component percentage(s) from ${comparison.targetVersion.versionNumber}`,
    });
  };

  const isLoading = versionsLoading || comparisonLoading;
  const showComparison = comparison && baseVersionId && targetVersionId && baseVersionId !== targetVersionId;

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "added":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "removed":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "changed":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "added":
        return <Plus className="h-3 w-3" />;
      case "removed":
        return <Minus className="h-3 w-3" />;
      case "changed":
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <Equal className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GitCompare className="h-6 w-6 text-primary" />
              Version Comparison
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Compare formulation versions side-by-side
            </p>
          </div>
        </div>
      </div>

      {/* Version Selectors */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Select Versions to Compare</CardTitle>
          <CardDescription>Choose two versions to see their differences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Version Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Base Version
              </label>
              <Select value={baseVersionId} onValueChange={setBaseVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select base version" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.versionNumber}</span>
                        <Badge variant="secondary" className="text-xs">
                          {version.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Version Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Target Version
              </label>
              <Select value={targetVersionId} onValueChange={setTargetVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target version" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.versionNumber}</span>
                        <Badge variant="secondary" className="text-xs">
                          {version.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {baseVersionId && targetVersionId && baseVersionId === targetVersionId && (
            <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Please select two different versions to compare</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Summary Statistics */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {comparison.summary.addedComponents}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3" />
                    Added
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {comparison.summary.removedComponents}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Minus className="h-3 w-3" />
                    Removed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {comparison.summary.changedComponents}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Changed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground">
                    {comparison.summary.unchangedComponents}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Equal className="h-3 w-3" />
                    Unchanged
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version Metadata Comparison */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">Version Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Version */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-semibold text-lg">{comparison.baseVersion.versionNumber}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(comparison.baseVersion.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{comparison.baseVersion.status}</Badge>
                      {comparison.baseVersion.branchType && (
                        <Badge variant="outline">{comparison.baseVersion.branchType}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                </div>

                {/* Target Version */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="font-semibold text-lg">{comparison.targetVersion.versionNumber}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(comparison.targetVersion.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{comparison.targetVersion.status}</Badge>
                      {comparison.targetVersion.branchType && (
                        <Badge variant="outline">{comparison.targetVersion.branchType}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Component Comparison Table */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Component Comparison</CardTitle>
                  <CardDescription>
                    Ingredient composition differences between versions
                    {Object.keys(editedComponents).length > 0 && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">
                        ({Object.keys(editedComponents).length} component{Object.keys(editedComponents).length > 1 ? 's' : ''} edited)
                      </span>
                    )}
                  </CardDescription>
                </div>
                {Object.keys(editedComponents).length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditedComponents({})}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={handleCreateNewVersion}
                      disabled={createVersionMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {createVersionMutation.isPending ? "Creating..." : "Create New Version"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-1">Status</div>
                  <div className="col-span-3">Material</div>
                  <div className="col-span-2">Code</div>
                  <div className="col-span-2 text-right">Base %</div>
                  <div className="col-span-2 text-right">Target %</div>
                  <div className="col-span-2 text-right">Diff</div>
                </div>

                {/* Table Rows */}
                {comparison.componentComparisons.map((comp, index) => (
                  <motion.div
                    key={comp.materialId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`grid grid-cols-12 gap-2 text-sm py-3 px-2 rounded-lg border ${getStatusColor(
                      comp.status
                    )}`}
                  >
                    <div className="col-span-1 flex items-center">
                      <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center">
                        {getStatusIcon(comp.status)}
                      </Badge>
                    </div>
                    <div className="col-span-3 font-medium truncate" title={comp.materialName}>
                      {comp.materialName}
                    </div>
                    <div className="col-span-2 text-muted-foreground font-mono text-xs truncate">
                      {comp.materialCode}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {comp.basePercentage !== null ? (
                        <span className="text-blue-600 dark:text-blue-400">{parseFloat(comp.basePercentage).toFixed(2)}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {comp.targetPercentage !== null ? (
                        <div className="flex items-center justify-end gap-1 group">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={editedComponents[comp.materialId] ?? parseFloat(comp.targetPercentage)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0 && value <= 100) {
                                setEditedComponents(prev => ({
                                  ...prev,
                                  [comp.materialId]: value
                                }));
                              }
                            }}
                            className={`h-7 w-20 text-right font-mono text-sm ${
                              editedComponents[comp.materialId] !== undefined
                                ? "border-blue-500 ring-2 ring-blue-500/20"
                                : ""
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                          {editedComponents[comp.materialId] !== undefined && (
                            <Edit2 className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-mono font-semibold">
                      {comp.percentageDiff !== null ? (
                        <span
                          className={
                            parseFloat(comp.percentageDiff) > 0
                              ? "text-green-600 dark:text-green-400 flex items-center justify-end gap-1"
                              : parseFloat(comp.percentageDiff) < 0
                              ? "text-red-600 dark:text-red-400 flex items-center justify-end gap-1"
                              : "text-muted-foreground"
                          }
                        >
                          {parseFloat(comp.percentageDiff) > 0 && <TrendingUp className="h-3 w-3" />}
                          {parseFloat(comp.percentageDiff) < 0 && <TrendingDown className="h-3 w-3" />}
                          {parseFloat(comp.percentageDiff) > 0 ? "+" : ""}
                          {parseFloat(comp.percentageDiff).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && baseVersionId && targetVersionId && (
        <Card className="glass">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading comparison...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
