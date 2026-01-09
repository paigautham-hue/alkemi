import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FlaskConical, Plus, Search, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import FormulationFamilyCreateDialog from "@/components/FormulationFamilyCreateDialog";

export default function Formulations() {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: families, isLoading } = trpc.formulations.listFamilies.useQuery({ search });

  const getConfidentialityColor = (level: string) => {
    const colors: Record<string, string> = {
      public: "bg-green-100 text-green-800",
      internal: "bg-blue-100 text-blue-800",
      confidential: "bg-orange-100 text-orange-800",
      restricted: "bg-red-100 text-red-800",
    };
    return colors[level] || colors.internal;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formulations</h1>
            <p className="text-muted-foreground mt-1">
              Manage formulation families with version control and branching
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Formulation
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Formulation Families</CardTitle>
                <CardDescription>
                  {families?.length || 0} formulation families
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search formulations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading formulations...</div>
            ) : families && families.length > 0 ? (
              <div className="grid gap-4">
                {families.map((family) => (
                  <Link key={family.id} href={`/formulations/${family.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{family.name}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {family.code}
                              </Badge>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getConfidentialityColor(
                                  family.confidentialityLevel
                                )}`}
                              >
                                {family.confidentialityLevel}
                              </span>
                            </div>
                            <CardDescription>
                              {family.description || "No description provided"}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                toast.info("Compliance check feature available in formulation editor");
                              }}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {family.targetApplication && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Target Application:</span>{" "}
                            {family.targetApplication}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No formulations yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first formulation family to start developing products
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Formulation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <FormulationFamilyCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
}
