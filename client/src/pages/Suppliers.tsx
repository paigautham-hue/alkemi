import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Suppliers() {
  const [search, setSearch] = useState("");
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground mt-1">
              Manage supplier relationships and qualification status
            </p>
          </div>
          <Button onClick={() => toast.info("Supplier creation dialog coming soon")}>
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
              <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
            ) : suppliers && suppliers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={supplier.id}>
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
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No suppliers yet</h3>
                <p className="text-muted-foreground mt-2">
                  Add suppliers to track qualification status and manage relationships
                </p>
                <Button className="mt-4" onClick={() => toast.info("Supplier creation coming soon")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Supplier
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
