import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldCheck, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceStatusDialogProps {
  versionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplianceStatusDialog({
  versionId,
  open,
  onOpenChange,
}: ComplianceStatusDialogProps) {
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const checkCompliance = trpc.compliance.check.useMutation({
    onSuccess: (data) => {
      setComplianceResult(data);
    },
  });

  useEffect(() => {
    if (open && versionId) {
      setComplianceResult(null);
      checkCompliance.mutate({ formulationVersionId: versionId });
    }
  }, [open, versionId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {complianceResult?.passed ? (
              <>
                <ShieldCheck className="h-6 w-6 text-green-600" />
                Compliance Check Passed
              </>
            ) : (
              <>
                <ShieldAlert className="h-6 w-6 text-destructive" />
                Compliance Issues Found
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Regulatory compliance check results for this formulation
          </DialogDescription>
        </DialogHeader>

        {checkCompliance.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {complianceResult && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription>
                  Checked against {complianceResult.totalRules} active compliance rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Rules Checked</span>
                  <Badge variant="outline">{complianceResult.totalRules}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Passed</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {complianceResult.passedRules}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <Badge variant="destructive">{complianceResult.failedRules}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Checked at</span>
                  <span>{new Date(complianceResult.checkedAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Violations */}
            {complianceResult.violations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Violations</h3>
                {complianceResult.violations.map((violation: any, index: number) => (
                  <Alert key={index} variant={violation.severity === "critical" || violation.severity === "error" ? "destructive" : "default"}>
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(violation.severity)}
                      <div className="flex-1 space-y-2">
                        <AlertTitle className="flex items-center gap-2">
                          {violation.ruleName}
                          <Badge variant={getSeverityColor(violation.severity) as any}>
                            {violation.severity}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>{violation.message}</p>
                          
                          {violation.affectedComponents && violation.affectedComponents.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mt-2">Affected Components:</p>
                              <ul className="list-disc list-inside text-sm">
                                {violation.affectedComponents.map((comp: string, i: number) => (
                                  <li key={i}>{comp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            <p>
                              <strong>Source:</strong> {violation.sourceInfo.sourceName} ({violation.sourceInfo.sourceType})
                              {violation.sourceInfo.jurisdiction && ` • ${violation.sourceInfo.jurisdiction}`}
                            </p>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            {/* Success Message */}
            {complianceResult.passed && (
              <Alert className="border-green-200 bg-green-50">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">All Compliance Checks Passed</AlertTitle>
                <AlertDescription className="text-green-700">
                  This formulation meets all active regulatory requirements and compliance rules.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
