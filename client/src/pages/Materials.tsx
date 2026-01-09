import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Search, GitBranch, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import MaterialCreateDialog from "@/components/MaterialCreateDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Materials() {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [alternativesDialogOpen, setAlternativesDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const { data: materials, isLoading } = trpc.materials.list.useQuery({ search });
  const { data: alternatives, isLoading: alternativesLoading } = trpc.supplierIntelligence.findAlternatives.useQuery(
    { materialId: selectedMaterialId! },
    { enabled: !!selectedMaterialId && alternativesDialogOpen }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
            <p className="text-muted-foreground mt-1">
              Manage your materials library with properties and suppliers
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Materials Library</CardTitle>
                <CardDescription>
                  {materials?.length || 0} materials in your organization
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading materials...</div>
            ) : materials && materials.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>CAS Number</TableHead>
                    <TableHead>Density</TableHead>
                    <TableHead>Cost/kg</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.code}</TableCell>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.category || "-"}</TableCell>
                      <TableCell>{material.casNumber || "-"}</TableCell>
                      <TableCell>{material.density ? `${material.density} g/cm³` : "-"}</TableCell>
                      <TableCell>
                        {material.costPerKg
                          ? `${material.currency || "USD"} ${material.costPerKg}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMaterialId(material.id);
                              setAlternativesDialogOpen(true);
                            }}
                          >
                            <GitBranch className="h-4 w-4 mr-1" />
                            Alternatives
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info("Edit functionality coming soon")}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No materials yet</h3>
                <p className="text-muted-foreground mt-2">
                  Get started by adding your first material to the library
                </p>
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Material
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <MaterialCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {/* Alternatives Dialog */}
        <Dialog open={alternativesDialogOpen} onOpenChange={setAlternativesDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Material Alternatives</DialogTitle>
              <DialogDescription>
                Similar materials that could be used as substitutes
              </DialogDescription>
            </DialogHeader>
            {alternativesLoading ? (
              <div className="text-center py-8">Loading alternatives...</div>
            ) : alternatives && alternatives.length > 0 ? (
              <div className="space-y-3">
                {alternatives.map((alt, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {alt.materialCode} - {alt.materialName}
                          </h4>
                          {alt.tradeName && (
                            <p className="text-sm text-muted-foreground">Trade Name: {alt.tradeName}</p>
                          )}
                          {alt.supplierName && (
                            <p className="text-sm text-muted-foreground">Supplier: {alt.supplierName}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-lg">
                          {(alt.similarityScore * 100).toFixed(0)}% Match
                        </Badge>
                      </div>
                      
                      {alt.costComparison && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 border border-green-200 rounded">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Cost savings: {alt.costComparison.savings!.toFixed(2)} ({alt.costComparison.savingsPercent!.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                      
                      {alt.riskFactors.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="text-sm text-yellow-800">
                            <strong>Risk Factors:</strong> {alt.riskFactors.join(", ")}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No suitable alternatives found
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
