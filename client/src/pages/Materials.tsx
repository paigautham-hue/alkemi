import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Materials() {
  const [search, setSearch] = useState("");
  const { data: materials, isLoading } = trpc.materials.list.useQuery({ search });

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
          <Button onClick={() => toast.info("Material creation dialog coming soon")}>
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
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No materials yet</h3>
                <p className="text-muted-foreground mt-2">
                  Get started by adding your first material to the library
                </p>
                <Button className="mt-4" onClick={() => toast.info("Material creation coming soon")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Material
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
