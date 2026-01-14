import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast as showToast } from "sonner";
import { AlertTriangle, TrendingUp, Zap, Thermometer, Wind, Settings2 } from "lucide-react";

function ScaleUpAnalyzer() {
  const [selectedFormulation, setSelectedFormulation] = useState<string>("");
  const [labVolume, setLabVolume] = useState<string>("1");
  const [pilotVolume, setPilotVolume] = useState<string>("100");
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const formulationsQuery = trpc.formulations.listFamilies.useQuery({});
  const analyzeM = trpc.scaleup.analyze.useMutation({
    onSuccess: (data) => {
      showToast.success("Scale-up risk analysis completed successfully");
      if (data.insertId) setSelectedAnalysis(String(data.insertId));
      analysesQuery.refetch();
    },
    onError: (error) => {
      showToast.error(`Analysis failed: ${error.message}`);
    },
  });

  const analysesQuery = trpc.scaleup.list.useQuery(
    { formulationVersionId: selectedFormulation },
    { enabled: !!selectedFormulation }
  );

  const analysisQuery = trpc.scaleup.getById.useQuery(
    { id: selectedAnalysis! },
    { enabled: !!selectedAnalysis }
  );

  const handleAnalyze = () => {
    if (!selectedFormulation) {
      showToast.error("Please select a formulation");
      return;
    }

    analyzeM.mutate({
      formulationVersionId: selectedFormulation,
      labScale: { volume: parseFloat(labVolume), unit: "L" },
      pilotScale: { volume: parseFloat(pilotVolume), unit: "L" },
    });
  };

  const analysis = analysisQuery.data;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-orange-500";
      case "critical": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Scale-Up Risk Analyzer</h1>
          <p className="text-muted-foreground">
            Analyze lab-to-pilot scale-up risks using reaction kinetics, heat transfer, and mass transfer principles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>New Analysis</CardTitle>
              <CardDescription>Configure scale-up parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Formulation</Label>
                <Select value={selectedFormulation} onValueChange={setSelectedFormulation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select formulation" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulationsQuery.data?.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.versionNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lab Scale (L)</Label>
                <Input
                  type="number"
                  value={labVolume}
                  onChange={(e) => setLabVolume(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Pilot Scale (L)</Label>
                <Input
                  type="number"
                  value={pilotVolume}
                  onChange={(e) => setPilotVolume(e.target.value)}
                  placeholder="100"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={analyzeM.isPending}
                className="w-full"
              >
                {analyzeM.isPending ? "Analyzing..." : "Run Analysis"}
              </Button>

              {/* Analysis History */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Analysis History</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysesQuery.data?.map((a: any) => (
                    <Button
                      key={a.id}
                      variant={selectedAnalysis === a.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedAnalysis(a.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm">
                          {a.analyzedAt ? new Date(a.analyzedAt).toLocaleDateString() : "N/A"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {a.labScale?.volume}L → {a.pilotScale?.volume}L
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {analysis ? (
              <>
                {/* Risk Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Risk Assessment</span>
                      <Badge className={getRiskColor(analysis.riskLevel || "unknown")}>
                        {analysis.riskLevel?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Overall Risk Score: {analysis.overallRiskScore ? parseFloat(analysis.overallRiskScore).toFixed(2) : "0.00"}/12
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Reaction Type</div>
                        <div className="font-medium">{analysis.reactionType}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Temperature Rise</div>
                        <div className="font-medium">{parseFloat(analysis.temperatureRisePrediction || "0").toFixed(1)}°C</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="risks">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="risks">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Risks
                    </TabsTrigger>
                    <TabsTrigger value="kinetics">
                      <Zap className="w-4 h-4 mr-2" />
                      Kinetics
                    </TabsTrigger>
                    <TabsTrigger value="transfer">
                      <Wind className="w-4 h-4 mr-2" />
                      Transfer
                    </TabsTrigger>
                    <TabsTrigger value="recommendations">
                      <Settings2 className="w-4 h-4 mr-2" />
                      Actions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="risks" className="space-y-4">
                    {(analysis.identifiedRisks as any[])?.map((risk, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>{risk.category}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline">{risk.severity}</Badge>
                              <Badge variant="secondary">{risk.likelihood}</Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <div className="text-sm font-medium">Description:</div>
                            <div className="text-sm text-muted-foreground">{risk.description}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Mitigation:</div>
                            <div className="text-sm text-muted-foreground">{risk.mitigation}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="kinetics">
                    <Card>
                      <CardHeader>
                        <CardTitle>Reaction Kinetics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Rate Constant</div>
                            <div className="font-medium">{parseFloat(analysis.rateConstant || "0").toExponential(2)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Activation Energy</div>
                            <div className="font-medium">{parseFloat(analysis.activationEnergy || "0").toFixed(1)} kJ/mol</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Reaction Order</div>
                            <div className="font-medium">{parseFloat(analysis.reactionOrder || "0").toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Heat Generation</div>
                            <div className="font-medium">{parseFloat(analysis.heatGenerationRate || "0").toFixed(1)} W/L</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="transfer">
                    <Card>
                      <CardHeader>
                        <CardTitle>Heat & Mass Transfer</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-2">Lab Scale</div>
                            <div className="space-y-1 text-sm">
                              <div>Mixing Time: {parseFloat(analysis.mixingTimeLab || "0").toFixed(1)}s</div>
                              <div>Reynolds: {parseFloat(analysis.reynoldsNumberLab || "0").toFixed(0)}</div>
                              <div>Power/Vol: {parseFloat(analysis.powerPerVolumeLab || "0").toFixed(1)} W/L</div>
                              <div>Cooling: {parseFloat(analysis.coolingCapacityLab || "0").toFixed(1)} W/L</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">Pilot Scale</div>
                            <div className="space-y-1 text-sm">
                              <div>Mixing Time: {parseFloat(analysis.mixingTimePilot || "0").toFixed(1)}s</div>
                              <div>Reynolds: {parseFloat(analysis.reynoldsNumberPilot || "0").toFixed(0)}</div>
                              <div>Power/Vol: {parseFloat(analysis.powerPerVolumePilot || "0").toFixed(1)} W/L</div>
                              <div>Cooling: {parseFloat(analysis.coolingCapacityPilot || "0").toFixed(1)} W/L</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Process Modifications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {(analysis.processModifications as string[])?.map((mod, idx) => (
                            <li key={idx}>{mod}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Equipment Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {(analysis.equipmentRecommendations as string[])?.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Control Strategy Changes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {(analysis.controlStrategyChanges as string[])?.map((change, idx) => (
                            <li key={idx}>{change}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Additional Testing Needed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {(analysis.additionalTestingNeeded as string[])?.map((test, idx) => (
                            <li key={idx}>{test}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Select a formulation and run an analysis to see scale-up risk assessment
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ScaleUpAnalyzer;
