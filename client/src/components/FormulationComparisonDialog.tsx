import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Plus, Minus, TrendingUp, TrendingDown } from "lucide-react";

interface FormulationComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseVersionId: string;
  targetVersionId: string;
}

export function FormulationComparisonDialog({
  open,
  onOpenChange,
  baseVersionId,
  targetVersionId,
}: FormulationComparisonDialogProps) {
  const { data: comparison, isLoading } = trpc.formulations.compare.useQuery(
    { baseVersionId, targetVersionId },
    { enabled: open && !!baseVersionId && !!targetVersionId }
  );

  if (!comparison && !isLoading) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "added":
        return "bg-green-100 text-green-800 border-green-200";
      case "removed":
        return "bg-red-100 text-red-800 border-red-200";
      case "changed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "added":
        return <Plus className="w-4 h-4" />;
      case "removed":
        return <Minus className="w-4 h-4" />;
      case "changed":
        return <ArrowRight className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formulation Comparison</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading comparison...</div>
          </div>
        )}

        {comparison && (
          <div className="space-y-6">
            {/* Version Headers */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Base Version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Version:</span>{" "}
                    {comparison.baseVersion.versionNumber}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge variant="outline">{comparison.baseVersion.status}</Badge>
                  </div>
                  {comparison.baseVersion.branchType && (
                    <div>
                      <span className="font-medium">Branch:</span>{" "}
                      <Badge variant="secondary">{comparison.baseVersion.branchType}</Badge>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(comparison.baseVersion.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Target Version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Version:</span>{" "}
                    {comparison.targetVersion.versionNumber}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge variant="outline">{comparison.targetVersion.status}</Badge>
                  </div>
                  {comparison.targetVersion.branchType && (
                    <div>
                      <span className="font-medium">Branch:</span>{" "}
                      <Badge variant="secondary">{comparison.targetVersion.branchType}</Badge>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(comparison.targetVersion.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{comparison.summary.totalComponents}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {comparison.summary.addedComponents}
                    </div>
                    <div className="text-xs text-muted-foreground">Added</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {comparison.summary.removedComponents}
                    </div>
                    <div className="text-xs text-muted-foreground">Removed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {comparison.summary.changedComponents}
                    </div>
                    <div className="text-xs text-muted-foreground">Changed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {comparison.summary.unchangedComponents}
                    </div>
                    <div className="text-xs text-muted-foreground">Unchanged</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Component Comparison Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Composition Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Status</th>
                        <th className="text-left py-2 px-2 font-medium">Material</th>
                        <th className="text-left py-2 px-2 font-medium">Code</th>
                        <th className="text-right py-2 px-2 font-medium">Base %</th>
                        <th className="text-center py-2 px-2 font-medium">Change</th>
                        <th className="text-right py-2 px-2 font-medium">Target %</th>
                        <th className="text-left py-2 px-2 font-medium">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.componentComparisons.map((comp, idx) => (
                        <tr
                          key={idx}
                          className={`border-b ${
                            comp.status !== "unchanged" ? getStatusColor(comp.status) : ""
                          }`}
                        >
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(comp.status)}
                              <span className="text-xs capitalize">{comp.status}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 font-medium">{comp.materialName}</td>
                          <td className="py-2 px-2 text-muted-foreground">{comp.materialCode}</td>
                          <td className="py-2 px-2 text-right">
                            {comp.basePercentage ? `${parseFloat(comp.basePercentage).toFixed(2)}%` : "-"}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {comp.percentageDiff && parseFloat(comp.percentageDiff) !== 0 && (
                              <div className="flex items-center justify-center gap-1">
                                {parseFloat(comp.percentageDiff) > 0 ? (
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                )}
                                <span
                                  className={
                                    parseFloat(comp.percentageDiff) > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {parseFloat(comp.percentageDiff) > 0 ? "+" : ""}
                                  {parseFloat(comp.percentageDiff).toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {comp.targetPercentage ? `${parseFloat(comp.targetPercentage).toFixed(2)}%` : "-"}
                          </td>
                          <td className="py-2 px-2">
                            {comp.targetRole || comp.baseRole ? (
                              <Badge variant="outline" className="text-xs">
                                {comp.targetRole || comp.baseRole}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Property Comparison */}
            {comparison.propertyComparisons.some((p) => p.changed) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Property Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {comparison.propertyComparisons
                      .filter((p) => p.changed)
                      .map((prop, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="font-medium">{prop.property}:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{prop.baseValue || "N/A"}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-medium">{prop.targetValue || "N/A"}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
