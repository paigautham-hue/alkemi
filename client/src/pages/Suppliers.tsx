import DashboardLayout from "@/components/DashboardLayout";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Search, Download, Trash2, CheckSquare, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SupplierCreateDialog from "@/components/SupplierCreateDialog";
import { SkeletonTable } from "@/components/SkeletonLoaders";

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery({ search });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      qualified: "default",
      pending: "secondary",
      under_review: "outline",
      disqualified: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground mt-1">
              Manage supplier relationships and qualification status
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Supplier Directory</CardTitle>
                <CardDescription>
                  {suppliers?.length || 0} suppliers in your network
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonTable rows={8} columns={6} />
            ) : suppliers && suppliers.length > 0 ? (
              <>
              {selectedSuppliers.size > 0 && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <Badge variant="default" className="px-3 py-1">
                    {selectedSuppliers.size} selected
                  </Badge>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const selectedData = suppliers?.filter(s => selectedSuppliers.has(s.id)) || [];
                        const csv = [
                          ['Code', 'Name', 'Country', 'Contact Email', 'Contact Phone', 'Risk Score', 'Status'].join(','),
                          ...selectedData.map(s => [
                            s.code,
                            s.name,
                            s.country || '',
                            s.contactEmail || '',
                            s.contactPhone || '',
                            s.riskScore || '',
                            s.qualificationStatus
                          ].join(','))
                        ].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        toast.success('Exported suppliers', { description: `${selectedSuppliers.size} suppliers exported to CSV` });
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const selectedData = suppliers?.filter(s => selectedSuppliers.has(s.id)) || [];
                        const json = JSON.stringify(selectedData, null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `suppliers-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        toast.success('Exported suppliers', { description: `${selectedSuppliers.size} suppliers exported to JSON` });
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedSuppliers(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <button
                        onClick={() => {
                          if (selectedSuppliers.size === suppliers?.length) {
                            setSelectedSuppliers(new Set());
                          } else {
                            setSelectedSuppliers(new Set(suppliers?.map(s => s.id) || []));
                          }
                        }}
                        className="flex items-center justify-center w-full h-full"
                      >
                        {selectedSuppliers.size === suppliers?.length && suppliers?.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id} className={selectedSuppliers.has(supplier.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <button
                          onClick={() => {
                            const newSelected = new Set(selectedSuppliers);
                            if (newSelected.has(supplier.id)) {
                              newSelected.delete(supplier.id);
                            } else {
                              newSelected.add(supplier.id);
                            }
                            setSelectedSuppliers(newSelected);
                          }}
                          className="flex items-center justify-center w-full h-full"
                        >
                          {selectedSuppliers.has(supplier.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{supplier.code}</TableCell>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>{supplier.country || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {supplier.contactEmail || supplier.contactPhone || "-"}
                      </TableCell>
                      <TableCell>
                        {supplier.riskScore ? (
                          <span
                            className={
                              parseFloat(supplier.riskScore) > 50
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {supplier.riskScore}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(supplier.qualificationStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("Edit functionality coming soon")}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </>
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No suppliers yet</h3>
                <p className="text-muted-foreground mt-2">
                  Add suppliers to track qualification status and manage relationships
                </p>
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Supplier
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <SupplierCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}
