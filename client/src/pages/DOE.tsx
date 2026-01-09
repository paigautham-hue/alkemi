import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Download, Trash2, FlaskConical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Factor {
  name: string;
  min: number;
  max: number;
  unit: string;
}

export default function DOE() {
  const [designType, setDesignType] = useState<"lhs" | "factorial" | "fractional" | "ccd">("lhs");
  const [factors, setFactors] = useState<Factor[]>([
    { name: "Temperature", min: 20, max: 80, unit: "°C" },
    { name: "Mixing Speed", min: 100, max: 500, unit: "rpm" },
  ]);
  const [numSamples, setNumSamples] = useState(20);
  const [levelsPerFactor, setLevelsPerFactor] = useState(2);
  const [resolution, setResolution] = useState<"III" | "IV" | "V">("IV");
  const [centerPoints, setCenterPoints] = useState(3);
  const [design, setDesign] = useState<any>(null);

  const lhsMutation = trpc.doe.generateLHS.useMutation({
    onSuccess: (data) => {
      setDesign(data);
      toast.success("Design generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate design: ${error.message}`);
    },
  });

  const factorialMutation = trpc.doe.generateFactorial.useMutation({
    onSuccess: (data) => {
      setDesign(data);
      toast.success("Design generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate design: ${error.message}`);
    },
  });

  const fractionalMutation = trpc.doe.generateFractional.useMutation({
    onSuccess: (data) => {
      setDesign(data);
      toast.success("Design generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate design: ${error.message}`);
    },
  });

  const ccdMutation = trpc.doe.generateCCD.useMutation({
    onSuccess: (data) => {
      setDesign(data);
      toast.success("Design generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate design: ${error.message}`);
    },
  });

  const addFactor = () => {
    setFactors([...factors, { name: "", min: 0, max: 100, unit: "" }]);
  };

  const removeFactor = (index: number) => {
    setFactors(factors.filter((_, i) => i !== index));
  };

  const updateFactor = (index: number, field: keyof Factor, value: string | number) => {
    const updated = [...factors];
    updated[index] = { ...updated[index], [field]: value };
    setFactors(updated);
  };

  const generateDesign = () => {
    if (factors.some(f => !f.name || f.min >= f.max)) {
      toast.error("Please fill in all factor details correctly");
      return;
    }

    switch (designType) {
      case "lhs":
        lhsMutation.mutate({ factors, numSamples });
        break;
      case "factorial":
        factorialMutation.mutate({ factors, levelsPerFactor });
        break;
      case "fractional":
        fractionalMutation.mutate({ factors, resolution });
        break;
      case "ccd":
        ccdMutation.mutate({ factors, centerPoints });
        break;
    }
  };

  const downloadCSV = () => {
    if (!design) return;

    const headers = ["Run", ...design.factors.map((f: any) => `${f.name} (${f.unit || "-"})`)];
    const rows = design.designPoints.map((point: any) => [
      point.runNumber,
      ...design.factors.map((f: any) => point.factors[f.name]),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doe_${designType}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design of Experiments</h1>
          <p className="text-muted-foreground mt-1">
            Generate experimental designs for systematic testing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Design Configuration</CardTitle>
              <CardDescription>Define factors and design type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Design Type</Label>
                <Select value={designType} onValueChange={(v: any) => setDesignType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lhs">Latin Hypercube</SelectItem>
                    <SelectItem value="factorial">Full Factorial</SelectItem>
                    <SelectItem value="fractional">Fractional Factorial</SelectItem>
                    <SelectItem value="ccd">Central Composite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {designType === "lhs" && (
                <div className="space-y-2">
                  <Label>Number of Samples</Label>
                  <Input
                    type="number"
                    value={numSamples}
                    onChange={(e) => setNumSamples(parseInt(e.target.value))}
                    min={4}
                    max={1000}
                  />
                </div>
              )}

              {designType === "factorial" && (
                <div className="space-y-2">
                  <Label>Levels per Factor</Label>
                  <Input
                    type="number"
                    value={levelsPerFactor}
                    onChange={(e) => setLevelsPerFactor(parseInt(e.target.value))}
                    min={2}
                    max={5}
                  />
                </div>
              )}

              {designType === "fractional" && (
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="III">III</SelectItem>
                      <SelectItem value="IV">IV</SelectItem>
                      <SelectItem value="V">V</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {designType === "ccd" && (
                <div className="space-y-2">
                  <Label>Center Points</Label>
                  <Input
                    type="number"
                    value={centerPoints}
                    onChange={(e) => setCenterPoints(parseInt(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-semibold">Factors</Label>
                  <Button variant="outline" size="sm" onClick={addFactor}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {factors.map((factor, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-3 pb-2">
                        <div className="space-y-2">
                          <Input
                            placeholder="Factor name"
                            value={factor.name}
                            onChange={(e) => updateFactor(idx, "name", e.target.value)}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Min"
                              type="number"
                              step="any"
                              value={factor.min}
                              onChange={(e) => updateFactor(idx, "min", parseFloat(e.target.value))}
                            />
                            <Input
                              placeholder="Max"
                              type="number"
                              step="any"
                              value={factor.max}
                              onChange={(e) => updateFactor(idx, "max", parseFloat(e.target.value))}
                            />
                            <Input
                              placeholder="Unit"
                              value={factor.unit}
                              onChange={(e) => updateFactor(idx, "unit", e.target.value)}
                            />
                          </div>
                          {factors.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFactor(idx)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={generateDesign}
                disabled={
                  lhsMutation.isPending ||
                  factorialMutation.isPending ||
                  fractionalMutation.isPending ||
                  ccdMutation.isPending
                }
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                Generate Design
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Design Matrix</CardTitle>
                  <CardDescription>
                    {design ? `${design.totalRuns} experimental runs` : "No design generated yet"}
                  </CardDescription>
                </div>
                {design && (
                  <Button variant="outline" onClick={downloadCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {design ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run</TableHead>
                        {design.factors.map((f: any, idx: number) => (
                          <TableHead key={idx}>
                            {f.name} ({f.unit || "-"})
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {design.designPoints.map((point: any) => (
                        <TableRow key={point.runNumber}>
                          <TableCell className="font-medium">{point.runNumber}</TableCell>
                          {design.factors.map((f: any, idx: number) => (
                            <TableCell key={idx}>{point.factors[f.name]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FlaskConical className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Configure factors and generate a design to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
