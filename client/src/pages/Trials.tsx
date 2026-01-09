import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, FlaskConical, TrendingUp, TrendingDown, AlertCircle, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Trials() {
  const { user, loading: authLoading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    formulationVersionId: "",
    testConditionSetId: "",
    trialCode: "",
    conductedAt: new Date().toISOString().split('T')[0],
    notes: "",
  });
  
  const [measurements, setMeasurements] = useState<Array<{
    propertyName: string;
    measuredValue: string;
    unit: string;
    measurementError: string;
  }>>([{ propertyName: "", measuredValue: "", unit: "", measurementError: "" }]);

  const { data: trials, isLoading, refetch } = trpc.trials.list.useQuery({}, { enabled: !!user });
  const { data: families } = trpc.formulations.listFamilies.useQuery({}, { enabled: !!user });
  const formulations = families?.flatMap((f: any) => 
    f.versions?.map((v: any) => ({ ...v, familyCode: f.code })) || []
  ) || [];
  const { data: testConditions } = trpc.testConditions.list.useQuery({}, { enabled: !!user });
  const { data: comparison } = trpc.trials.compare.useQuery(
    { trialId: selectedTrialId! },
    { enabled: !!selectedTrialId && compareDialogOpen }
  );

  const createMutation = trpc.trials.create.useMutation({
    onSuccess: () => {
      toast.success("Trial recorded successfully");
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to record trial: ${error.message}`);
    },
  });

  const deleteMutation = trpc.trials.delete.useMutation({
    onSuccess: () => {
      toast.success("Trial deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete trial: ${error.message}`);
    },
  });

  const resetForm = () => {
    setForm({
      formulationVersionId: "",
      testConditionSetId: "",
      trialCode: "",
      conductedAt: new Date().toISOString().split('T')[0],
      notes: "",
    });
    setMeasurements([{ propertyName: "", measuredValue: "", unit: "", measurementError: "" }]);
  };

  const addMeasurement = () => {
    setMeasurements([...measurements, { propertyName: "", measuredValue: "", unit: "", measurementError: "" }]);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const updateMeasurement = (index: number, field: string, value: string) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], [field]: value };
    setMeasurements(updated);
  };

  const handleCreate = () => {
    if (!form.formulationVersionId || !form.testConditionSetId || !form.trialCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    const validMeasurements = measurements.filter(
      m => m.propertyName && m.measuredValue
    );

    if (validMeasurements.length === 0) {
      toast.error("Please add at least one measurement");
      return;
    }

    createMutation.mutate({
      ...form,
      measurements: validMeasurements,
    });
  };

  const handleDelete = (trialId: string) => {
    if (confirm("Are you sure you want to delete this trial?")) {
      deleteMutation.mutate({ trialId });
    }
  };

  const openComparison = (trialId: string) => {
    setSelectedTrialId(trialId);
    setCompareDialogOpen(true);
  };

  const getErrorBadge = (percentError: number | null) => {
    if (percentError === null) return null;
    
    const absError = Math.abs(percentError);
    if (absError < 5) {
      return <Badge className="bg-green-100 text-green-800">Excellent (&lt;5%)</Badge>;
    } else if (absError < 10) {
      return <Badge className="bg-blue-100 text-blue-800">Good (&lt;10%)</Badge>;
    } else if (absError < 20) {
      return <Badge className="bg-yellow-100 text-yellow-800">Fair (&lt;20%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Poor (&gt;20%)</Badge>;
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to access trials.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Experimental Trials</h1>
          <p className="text-muted-foreground mt-1">
            Record lab results and compare with predictions
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Trial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Experimental Trial</DialogTitle>
              <DialogDescription>
                Enter trial details and measured property values
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formulation">Formulation Version *</Label>
                  <Select
                    value={form.formulationVersionId}
                    onValueChange={(value) => setForm(prev => ({ ...prev, formulationVersionId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select formulation" />
                    </SelectTrigger>
                    <SelectContent>
                      {formulations.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.familyCode} v{f.versionNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testCondition">Test Conditions *</Label>
                  <Select
                    value={form.testConditionSetId}
                    onValueChange={(value) => setForm(prev => ({ ...prev, testConditionSetId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      {testConditions?.map((tc) => (
                        <SelectItem key={tc.id} value={tc.id}>
                          {tc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trialCode">Trial Code *</Label>
                  <Input
                    id="trialCode"
                    value={form.trialCode}
                    onChange={(e) => setForm(prev => ({ ...prev, trialCode: e.target.value }))}
                    placeholder="e.g., TRIAL-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conductedAt">Date Conducted *</Label>
                  <Input
                    id="conductedAt"
                    type="date"
                    value={form.conductedAt}
                    onChange={(e) => setForm(prev => ({ ...prev, conductedAt: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observations, conditions, or any relevant notes"
                  rows={2}
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-semibold">Measurements</Label>
                  <Button variant="outline" size="sm" onClick={addMeasurement}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Measurement
                  </Button>
                </div>
                <div className="space-y-3">
                  {measurements.map((m, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            <Input
                              placeholder="Property name"
                              value={m.propertyName}
                              onChange={(e) => updateMeasurement(idx, "propertyName", e.target.value)}
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              placeholder="Value"
                              type="number"
                              step="any"
                              value={m.measuredValue}
                              onChange={(e) => updateMeasurement(idx, "measuredValue", e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="Unit"
                              value={m.unit}
                              onChange={(e) => updateMeasurement(idx, "unit", e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="Error"
                              type="number"
                              step="any"
                              value={m.measurementError}
                              onChange={(e) => updateMeasurement(idx, "measurementError", e.target.value)}
                            />
                          </div>
                          <div className="col-span-1 flex items-center">
                            {measurements.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMeasurement(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Recording..." : "Record Trial"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trials List */}
      {isLoading ? (
        <div className="text-center py-12">Loading trials...</div>
      ) : !trials || trials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trials recorded yet</h3>
            <p className="text-muted-foreground mb-4">
              Start recording experimental results to validate predictions
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record First Trial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trials.map((trial) => (
            <Card key={trial.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{trial.trialCode}</CardTitle>
                      <Badge variant="outline">
                        {new Date(trial.conductedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <CardDescription>
                      {trial.notes || "No notes provided"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openComparison(trial.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Compare
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(trial.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prediction vs Actual Comparison</DialogTitle>
            <DialogDescription>
              Compare predicted values with experimental measurements
            </DialogDescription>
          </DialogHeader>
          {comparison && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Trial Code:</span> {comparison.trial.trialCode}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(comparison.trial.conductedAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Measurements vs Predictions</h4>
                <div className="space-y-3">
                  {comparison.comparisons.map((comp, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{comp.propertyName}</h5>
                          {comp.percentError !== null && getErrorBadge(comp.percentError)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Measured</div>
                            <div className="text-lg font-semibold">
                              {comp.measuredValue.toFixed(2)} {comp.unit}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Predicted</div>
                            <div className="text-lg font-semibold">
                              {comp.predictedValue !== null ? (
                                `${comp.predictedValue.toFixed(2)} ${comp.unit}`
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Error</div>
                            <div className="text-lg font-semibold flex items-center gap-1">
                              {comp.error !== null ? (
                                <>
                                  {comp.error > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-green-500" />
                                  )}
                                  {Math.abs(comp.percentError!).toFixed(1)}%
                                </>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {comparison.comparisons.some(c => c.predictedValue === null) && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    Some measurements don't have matching predictions. Run predictions for this formulation and test conditions first.
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
