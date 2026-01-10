import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Globe,
  Package,
  Users,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SupplierRiskDashboard() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  // Fetch all supplier risk assessments
  const { data: riskAssessments, isLoading } = trpc.suppliers.assessAllRisks.useQuery();

  // Fetch detailed risk assessment for selected supplier
  const { data: detailedRisk } = trpc.suppliers.assessRisk.useQuery(
    { id: selectedSupplierId! },
    { enabled: !!selectedSupplierId }
  );

  // Fetch alternative suppliers for selected material
  const { data: alternatives } = trpc.suppliers.findAlternatives.useQuery(
    { materialId: selectedMaterialId!, limit: 5 },
    { enabled: !!selectedMaterialId }
  );

  // Fetch all materials for alternative supplier lookup
  const { data: materials } = trpc.materials.list.useQuery();

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "critical":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const criticalSuppliers = riskAssessments?.filter((s) => s.riskLevel === "critical") || [];
  const highRiskSuppliers = riskAssessments?.filter((s) => s.riskLevel === "high") || [];
  const averageRisk =
    (riskAssessments?.reduce((sum, s) => sum + s.overallRiskScore, 0) || 0) /
      (riskAssessments?.length || 1);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supplier Risk Assessment</h1>
        <p className="text-muted-foreground mt-2">
          Monitor supplier risks, qualification status, and find alternative sources
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskAssessments?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Users className="w-3 h-3 inline mr-1" />
              Active suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalSuppliers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <XCircle className="w-3 h-3 inline mr-1" />
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highRiskSuppliers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Need monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageRisk)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {averageRisk < 30 ? (
                <TrendingDown className="w-3 h-3 inline mr-1 text-green-600" />
              ) : (
                <TrendingUp className="w-3 h-3 inline mr-1 text-orange-600" />
              )}
              Out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Risk Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Risk Overview</CardTitle>
          <CardDescription>
            Comprehensive risk assessment for all suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Formulations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskAssessments?.map((assessment) => (
                <TableRow key={assessment.supplierId}>
                  <TableCell className="font-medium">{assessment.supplierName}</TableCell>
                  <TableCell>
                    <Badge className={getRiskBadgeColor(assessment.riskLevel)}>
                      {getRiskIcon(assessment.riskLevel)}
                      <span className="ml-1 capitalize">{assessment.riskLevel}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            assessment.overallRiskScore > 70
                              ? "bg-red-500"
                              : assessment.overallRiskScore > 50
                              ? "bg-orange-500"
                              : assessment.overallRiskScore > 30
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${assessment.overallRiskScore}%` }}
                        />
                      </div>
                      <span className="text-sm">{assessment.overallRiskScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {assessment.qualificationStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-muted-foreground" />
                      {assessment.country}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      {assessment.materialsSupplied}
                    </div>
                  </TableCell>
                  <TableCell>{assessment.formulationsImpacted}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSupplierId(assessment.supplierId)}
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Material Alternative Finder */}
      <Card>
        <CardHeader>
          <CardTitle>Find Alternative Suppliers</CardTitle>
          <CardDescription>
            Search for alternative suppliers for critical materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {materials?.slice(0, 6).map((material) => (
              <Button
                key={material.id}
                variant="outline"
                className="justify-start"
                onClick={() => setSelectedMaterialId(material.id)}
              >
                <Package className="w-4 h-4 mr-2" />
                {material.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Risk Dialog */}
      <Dialog open={!!selectedSupplierId} onOpenChange={() => setSelectedSupplierId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supplier Risk Assessment Details</DialogTitle>
          </DialogHeader>

          {detailedRisk && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="factors">Risk Factors</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Supplier Name</div>
                    <div className="text-lg font-semibold">{detailedRisk.supplierName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Overall Risk Level</div>
                    <Badge className={getRiskBadgeColor(detailedRisk.riskLevel)}>
                      {getRiskIcon(detailedRisk.riskLevel)}
                      <span className="ml-1 capitalize">{detailedRisk.riskLevel}</span>
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Risk Score</div>
                    <div className="text-lg font-semibold">{detailedRisk.overallRiskScore}/100</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Qualification Status</div>
                    <Badge variant="outline" className="capitalize">
                      {detailedRisk.qualificationStatus.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Country</div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      {detailedRisk.country}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Materials Supplied</div>
                    <div className="text-lg font-semibold">{detailedRisk.materialsSupplied}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Formulations Impacted</div>
                    <div className="text-lg font-semibold">{detailedRisk.formulationsImpacted}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Assessment</div>
                    <div className="text-sm">
                      {new Date(detailedRisk.lastAssessmentDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="factors" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Factor</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedRisk.riskFactors.map((factor, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{factor.category}</TableCell>
                        <TableCell>{factor.factor}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  factor.score > 70
                                    ? "bg-red-500"
                                    : factor.score > 50
                                    ? "bg-orange-500"
                                    : factor.score > 30
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${factor.score}%` }}
                              />
                            </div>
                            <span className="text-sm">{factor.score}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityBadgeColor(factor.severity)}>
                            {factor.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {factor.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Alternative Suppliers Dialog */}
      <Dialog open={!!selectedMaterialId} onOpenChange={() => setSelectedMaterialId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alternative Suppliers</DialogTitle>
          </DialogHeader>

          {alternatives && alternatives.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {alternatives.length} alternative supplier(s) for{" "}
                <span className="font-semibold">
                  {materials?.find((m) => m.id === selectedMaterialId)?.name}
                </span>
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Similarity</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Advantages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alternatives.map((alt) => (
                    <TableRow key={alt.supplierId}>
                      <TableCell className="font-medium">{alt.supplierName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${alt.similarityScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{alt.similarityScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                alt.riskScore > 70
                                  ? "bg-red-500"
                                  : alt.riskScore > 50
                                  ? "bg-orange-500"
                                  : alt.riskScore > 30
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${alt.riskScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{alt.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {alt.qualificationStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          {alt.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {alt.advantages.map((adv, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{adv}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No alternative suppliers found for this material.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
