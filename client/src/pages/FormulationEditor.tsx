import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus } from "lucide-react";
import { useRoute, Link } from "wouter";
import { toast } from "sonner";

export default function FormulationEditor() {
  const [, params] = useRoute("/formulations/:familyId");
  const familyId = params?.familyId || "";

  const { data: family, isLoading: familyLoading } = trpc.formulations.getFamilyById.useQuery(
    { id: familyId },
    { enabled: !!familyId }
  );

  const { data: versions, isLoading: versionsLoading } = trpc.formulations.listVersions.useQuery(
    { familyId },
    { enabled: !!familyId }
  );

  if (familyLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading formulation...</div>
      </DashboardLayout>
    );
  }

  if (!family) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">Formulation not found</h3>
          <Link href="/formulations">
            <Button className="mt-4" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Formulations
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      submitted: "outline",
      in_review: "outline",
      approved: "default",
      production: "default",
      rejected: "destructive",
      archived: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/formulations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{family.name}</h1>
              <Badge variant="outline">{family.code}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {family.description || "No description"}
            </p>
          </div>
          <Button onClick={() => toast.info("Version creation dialog coming soon")}>
            <Plus className="mr-2 h-4 w-4" />
            New Version
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
            <CardDescription>
              {versions?.length || 0} versions in this formulation family
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versionsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading versions...</div>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-3">
                {versions.map((version) => (
                  <Card key={version.id} className="hover:bg-accent/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{version.versionNumber}</CardTitle>
                            {getStatusBadge(version.status)}
                            {version.branchType && (
                              <Badge variant="outline" className="text-xs">
                                {version.branchType.replace("_", " ")}
                              </Badge>
                            )}
                          </div>
                          {version.notes && (
                            <CardDescription className="text-sm">{version.notes}</CardDescription>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info("Version details coming soon")}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No versions yet</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => toast.info("Version creation coming soon")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Version
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
