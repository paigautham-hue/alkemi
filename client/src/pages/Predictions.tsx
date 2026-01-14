import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Brain, TrendingUp, AlertCircle, Beaker, CheckCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Predictions() {
  const [open, setOpen] = useState(false);

  const { data: predictions, isLoading } = trpc.predictions.list.useQuery();

  return (
    <DashboardLayout>
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Predictions</h1>
          <p className="text-muted-foreground mt-2">
            Predict formulation properties with uncertainty quantification
          </p>
        </div>
        <RunPredictionDialog open={open} onOpenChange={setOpen} />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading predictions...</p>
        </div>
      ) : predictions && predictions.length > 0 ? (
        <div className="grid gap-4">
          {predictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No predictions yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Run your first prediction to get AI-powered property estimates
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Run Prediction
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </DashboardLayout>
  );
}

function PredictionCard({ prediction }: { prediction: any }) {
  const predictedValue = parseFloat(prediction.predictedValue);
  const uncertaintyLower = prediction.uncertaintyLower
    ? parseFloat(prediction.uncertaintyLower)
    : undefined;
  const uncertaintyUpper = prediction.uncertaintyUpper
    ? parseFloat(prediction.uncertaintyUpper)
    : undefined;
  const probabilityInSpec = prediction.probabilityInSpec
    ? parseFloat(prediction.probabilityInSpec)
    : undefined;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.9) return "text-green-600";
    if (prob >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{prediction.propertyName}</CardTitle>
            <CardDescription className="mt-1">
              {new Date(prediction.createdAt).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant="secondary">{prediction.modelName}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* LLM Prediction */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI-Powered Prediction
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h5 className="text-sm font-medium mb-2">Predicted Value</h5>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {predictedValue.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {prediction.unit}
                  </span>
                </div>
                {uncertaintyLower !== undefined && uncertaintyUpper !== undefined && (
                  <p className="text-sm text-muted-foreground mt-1">
                    95% CI: [{uncertaintyLower.toFixed(2)}, {uncertaintyUpper.toFixed(2)}]
                  </p>
                )}
              </div>

              {probabilityInSpec !== undefined && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Probability in Spec</h5>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${getProbabilityColor(probabilityInSpec)}`}>
                      {(probabilityInSpec * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {probabilityInSpec >= 0.9
                      ? "High confidence"
                      : probabilityInSpec >= 0.7
                      ? "Moderate confidence"
                      : "Low confidence"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Physics-Based Predictions */}
          {prediction.physicsBasedPredictions && prediction.physicsBasedPredictions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Physics-Based Calculations
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                {prediction.physicsBasedPredictions.map((phys: any, idx: number) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {phys.property.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={phys.confidence === 'high' ? 'default' : phys.confidence === 'medium' ? 'secondary' : 'outline'}>
                        {phys.confidence}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">{phys.value}</span>
                      <span className="text-xs text-muted-foreground">{phys.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{phys.method}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility Assessment */}
          {prediction.compatibilityAssessment && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Compatibility Assessment
              </h4>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Overall Compatibility</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={prediction.compatibilityAssessment.level === 'excellent' ? 'default' : prediction.compatibilityAssessment.level === 'good' ? 'secondary' : 'outline'}>
                      {prediction.compatibilityAssessment.level}
                    </Badge>
                    <span className="text-lg font-bold">{prediction.compatibilityAssessment.score}/100</span>
                  </div>
                </div>
                {prediction.compatibilityAssessment.warnings.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {prediction.compatibilityAssessment.warnings.map((warning: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
                {prediction.compatibilityAssessment.details.length > 0 && (
                  <div className="space-y-1">
                    {prediction.compatibilityAssessment.details.slice(0, 3).map((detail: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hansen Parameters */}
          {prediction.hansenParameters && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Hansen Solubility Parameters</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">δD (Dispersion)</p>
                  <p className="text-lg font-bold">{prediction.hansenParameters.hansenD.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">δP (Polar)</p>
                  <p className="text-lg font-bold">{prediction.hansenParameters.hansenP.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">δH (H-bonding)</p>
                  <p className="text-lg font-bold">{prediction.hansenParameters.hansenH.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RunPredictionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formulationVersionId, setFormulationVersionId] = useState("");
  const [testConditionSetId, setTestConditionSetId] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [hasSpec, setHasSpec] = useState(false);
  const [minSpec, setMinSpec] = useState("");
  const [maxSpec, setMaxSpec] = useState("");
  const [unit, setUnit] = useState("");

  const { data: families } = trpc.formulations.listFamilies.useQuery();
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const { data: versions } = trpc.formulations.listVersions.useQuery(
    { familyId: selectedFamilyId },
    { enabled: !!selectedFamilyId }
  );
  const { data: testConditionSets } = trpc.testConditions.list.useQuery();

  const utils = trpc.useUtils();

  const runPredictionMutation = trpc.predictions.runPrediction.useMutation({
    onSuccess: () => {
      toast.success("Prediction completed successfully");
      utils.predictions.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Prediction failed: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormulationVersionId("");
    setTestConditionSetId("");
    setPropertyName("");
    setHasSpec(false);
    setMinSpec("");
    setMaxSpec("");
    setUnit("");
    setSelectedFamilyId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulationVersionId || !testConditionSetId || !propertyName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const targetSpec =
      hasSpec && (minSpec || maxSpec)
        ? {
            min: minSpec ? parseFloat(minSpec) : undefined,
            max: maxSpec ? parseFloat(maxSpec) : undefined,
            unit: unit || undefined,
          }
        : undefined;

    runPredictionMutation.mutate({
      formulationVersionId,
      testConditionSetId,
      propertyName: propertyName.trim(),
      targetSpec,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Run Prediction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Run AI Prediction</DialogTitle>
            <DialogDescription>
              Predict a property for a formulation under specific test conditions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="family">Formulation Family *</Label>
              <Select
                value={selectedFamilyId}
                onValueChange={(value) => {
                  setSelectedFamilyId(value);
                  setFormulationVersionId("");
                }}
                required
              >
                <SelectTrigger id="family">
                  <SelectValue placeholder="Select formulation family" />
                </SelectTrigger>
                <SelectContent>
                  {families?.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Formulation Version *</Label>
              <Select
                value={formulationVersionId}
                onValueChange={setFormulationVersionId}
                disabled={!selectedFamilyId}
                required
              >
                <SelectTrigger id="version">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.versionNumber} - {version.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testConditions">Test Conditions *</Label>
              <Select
                value={testConditionSetId}
                onValueChange={setTestConditionSetId}
                required
              >
                <SelectTrigger id="testConditions">
                  <SelectValue placeholder="Select test conditions" />
                </SelectTrigger>
                <SelectContent>
                  {testConditionSets?.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property">Property to Predict *</Label>
              <Input
                id="property"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g., Viscosity, Hardness, Adhesion Strength"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the property name you want to predict
              </p>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSpec"
                  checked={hasSpec}
                  onCheckedChange={(checked) => setHasSpec(checked as boolean)}
                />
                <Label htmlFor="hasSpec" className="font-normal">
                  I have a target specification
                </Label>
              </div>

              {hasSpec && (
                <div className="grid gap-4 md:grid-cols-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="minSpec">Min Value</Label>
                    <Input
                      id="minSpec"
                      type="number"
                      step="any"
                      value={minSpec}
                      onChange={(e) => setMinSpec(e.target.value)}
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSpec">Max Value</Label>
                    <Input
                      id="maxSpec"
                      type="number"
                      step="any"
                      value={maxSpec}
                      onChange={(e) => setMaxSpec(e.target.value)}
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g., Pa·s"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">About AI Predictions</p>
                  <p>
                    The AI will analyze the formulation composition, material properties,
                    and test conditions to predict the property value with uncertainty
                    quantification and feature importance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={runPredictionMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={runPredictionMutation.isPending}>
              {runPredictionMutation.isPending ? "Running..." : "Run Prediction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
