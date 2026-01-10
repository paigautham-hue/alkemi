import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2, ArrowLeft, Save, Shield, Download } from "lucide-react";
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplianceStatusDialog } from "@/components/ComplianceStatusDialog";

export default function FormulationEditor() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/formulations/:familyId");
  const familyId = params?.familyId || "";
  
  const [addComponentOpen, setAddComponentOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [percentage, setPercentage] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);

  const generatePDF = trpc.reports.generateFormulationPDF.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF report generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });



  // Queries
  const { data: family, isLoading: familyLoading } = trpc.formulations.getFamilyById.useQuery(
    { id: familyId },
    { enabled: !!familyId }
  );

  const { data: materials, isLoading: materialsLoading } = trpc.materials.list.useQuery(
    { search: "" },
    { enabled: !!user }
  );

  const { data: versions, isLoading: versionsLoading } = trpc.formulations.listVersions.useQuery(
    { familyId },
    { enabled: !!familyId }
  );

  // Use selected version or first version
  const currentVersion = selectedVersionId 
    ? versions?.find(v => v.id === selectedVersionId)
    : versions?.[0];
  
  // Fetch components for current version
  const { data: components = [], isLoading: componentsLoading } = trpc.formulations.listComponents.useQuery(
    { versionId: currentVersion?.id || "" },
    { enabled: !!currentVersion?.id }
  );

  // Calculate total percentage
  const totalPercentage = components.reduce((sum: number, comp: any) => sum + parseFloat(comp.component.percentage), 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  // Mutations
  const utils = trpc.useUtils();
  
  const addComponent = trpc.formulations.addComponent.useMutation({
    onSuccess: () => {
      utils.formulations.listVersions.invalidate();
      toast.success("Component added successfully");
      setAddComponentOpen(false);
      setSelectedMaterialId("");
      setPercentage("");
      setPurpose("");
    },
    onError: (error) => {
      toast.error(`Failed to add component: ${error.message}`);
    },
  });

  const removeComponent = trpc.formulations.removeComponent.useMutation({
    onSuccess: () => {
      utils.formulations.listVersions.invalidate();
      toast.success("Component removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove component: ${error.message}`);
    },
  });

  const handleAddComponent = () => {
    if (!currentVersion) {
      toast.error("No version selected");
      return;
    }

    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      toast.error("Please enter a valid percentage between 0 and 100");
      return;
    }

    if (!selectedMaterialId) {
      toast.error("Please select a material");
      return;
    }

    addComponent.mutate({
      versionId: currentVersion.id,
      materialId: selectedMaterialId,
      percentage: percentage,
      role: purpose || undefined,
    });
  };

  const handleRemoveComponent = (materialId: string) => {
    if (!currentVersion) return;

    // Find the component to get its ID
    const componentData = components.find((c: any) => c.materialId === materialId);
    if (!componentData?.component?.id) {
      toast.error("Component not found");
      return;
    }
    
    removeComponent.mutate({
      id: componentData.component.id,
    });
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (familyLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!family) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-96">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Formulation Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The formulation family you're looking for doesn't exist.
            </p>
            <Link href="/formulations">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Formulations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/formulations">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Formulations
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{family.name}</h1>
              <Badge variant="outline">{family.code}</Badge>
            </div>
            <p className="text-muted-foreground">
              {family.description || "No description provided"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowComplianceDialog(true)}
              disabled={!currentVersion}
            >
              <Shield className="h-4 w-4 mr-2" />
              Check Compliance
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (currentVersion) {
                  generatePDF.mutate({ versionId: currentVersion.id });
                }
              }}
              disabled={!currentVersion || generatePDF.isPending}
            >
              {generatePDF.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button variant="outline" disabled>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {versionsLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !currentVersion ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-96">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Versions Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                This formulation family doesn't have any versions yet.
              </p>
              <Button onClick={() => toast.info("Version creation coming soon")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Version
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="composition" className="space-y-4">
            <TabsList>
              <TabsTrigger value="composition">Composition</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="history">Version History</TabsTrigger>
            </TabsList>

            <TabsContent value="composition" className="space-y-4">
              {/* Version Selector */}
              {versions && versions.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Select Version</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={selectedVersionId || currentVersion.id} 
                      onValueChange={setSelectedVersionId}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            Version {version.versionNumber} • {version.branchType} • {version.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Composition Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Composition</CardTitle>
                      <CardDescription>
                        Version {currentVersion.versionNumber} • {currentVersion.branchType}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Percentage</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPercentage.toFixed(2)}%
                          </span>
                          {isValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                      <Button onClick={() => setAddComponentOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Component
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {components.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Components</h3>
                      <p className="text-muted-foreground mb-4">
                        Add materials to start building your formulation
                      </p>
                      <Button onClick={() => setAddComponentOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Component
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {components.map((row: any) => {
                          const component = row.component;
                          const material = row.material;
                          return (
                            <TableRow key={component.id}>
                              <TableCell className="font-medium">
                                {material?.name || "Unknown Material"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{material?.code || "N/A"}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {material?.supplierId ? "Supplier" : "N/A"}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {parseFloat(component.percentage).toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {component.role || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveComponent(component.id)}
                                  disabled={removeComponent.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {!isValid && components.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900">Invalid Composition</h4>
                        <p className="text-sm text-red-700">
                          Total percentage must equal 100%. Current total: {totalPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Formulation Properties</CardTitle>
                  <CardDescription>
                    Target properties and specifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Target Viscosity (cP)</Label>
                        <Input type="number" placeholder="e.g., 1500" disabled />
                      </div>
                      <div>
                        <Label>Target Density (g/cm³)</Label>
                        <Input type="number" placeholder="e.g., 1.05" disabled />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea 
                        placeholder="Add notes about this formulation..." 
                        rows={4}
                        value={currentVersion.notes || ""}
                        disabled
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Property editing coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>
                    Track changes and compare versions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {versions?.map((version) => (
                      <div
                        key={version.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                          version.id === currentVersion.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedVersionId(version.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Version {version.versionNumber}</span>
                              <Badge variant="outline">{version.branchType}</Badge>
                              <Badge variant="secondary">{version.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Created {new Date(version.createdAt).toLocaleDateString()}
                              {version.notes && ` • ${version.notes}`}
                            </p>
                          </div>
                          {version.id === currentVersion.id && (
                            <Badge>Current</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Add Component Dialog */}
        <Dialog open={addComponentOpen} onOpenChange={setAddComponentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Component</DialogTitle>
              <DialogDescription>
                Add a material to this formulation version
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Material</Label>
                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialsLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                    ) : materials?.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No materials available</div>
                    ) : (
                      materials?.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Percentage (%)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 25.5"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Remaining: {(100 - totalPercentage).toFixed(2)}%
                </p>
              </div>

              <div>
                <Label>Purpose (Optional)</Label>
                <Input
                  placeholder="e.g., Binder, Pigment, Solvent"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddComponentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddComponent} disabled={addComponent.isPending}>
                {addComponent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Component
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Compliance Results Dialog */}
        {currentVersion && (
          <ComplianceStatusDialog
            versionId={currentVersion.id}
            open={showComplianceDialog}
            onOpenChange={setShowComplianceDialog}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
