import { useState } from "react";
import { useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FormulationComparison } from "@/components/FormulationComparison";
import {
  ArrowLeft,
  GitCompare,
  Plus,
  Calendar,
  User,
  FileText,
  Beaker,
} from "lucide-react";
import { Link } from "wouter";

export default function FormulationDetail() {
  const [, params] = useRoute("/formulations/:id");
  const familyId = params?.id || "";
  const [showComparison, setShowComparison] = useState(false);

  const { data: family, isLoading: familyLoading } = trpc.formulations.getFamilyById.useQuery(
    { id: familyId },
    { enabled: !!familyId }
  );

  const { data: versions, isLoading: versionsLoading } = trpc.formulations.listVersions.useQuery(
    { familyId },
    { enabled: !!familyId }
  );

  const isLoading = familyLoading || versionsLoading;

  if (showComparison) {
    return (
      <DashboardLayout>
        <AnimatedPage>
          <FormulationComparison
            familyId={familyId}
            onClose={() => setShowComparison(false)}
          />
        </AnimatedPage>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/formulations">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  {family?.name}
                  {family?.code && (
                    <Badge variant="outline" className="text-sm font-normal">
                      {family.code}
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {family?.description || "Formulation family details and version history"}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowComparison(true)} variant="gradient">
              <GitCompare className="mr-2 h-4 w-4" />
              Compare Versions
            </Button>
          </div>

          {/* Family Details */}
          {family && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Family Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Code:</span>
                    <p className="font-medium mt-1">{family.code}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Domain:</span>
                    <p className="font-medium mt-1">{family.domainId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidentiality:</span>
                    <Badge className="mt-1" variant="secondary">
                      {family.confidentialityLevel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Version History</CardTitle>
                  <CardDescription>
                    {versions?.length || 0} version{versions?.length !== 1 ? "s" : ""} in this family
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : versions && versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="glass border rounded-lg p-4 hover-lift transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold">{version.versionNumber}</span>
                            <Badge variant="secondary">{version.status}</Badge>
                            {version.branchType && (
                              <Badge variant="outline" className="text-xs">
                                {version.branchType}
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                Latest
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Created by {version.createdBy}</span>
                            </div>
                          </div>
                          {version.notes && (
                            <div className="flex items-start gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-muted-foreground">{version.notes}</p>
                            </div>
                          )}
                          {version.changeReason && (
                            <div className="text-sm bg-muted/50 rounded-md p-2">
                              <span className="font-medium">Change Reason:</span> {version.changeReason}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Beaker className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No versions found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create the first version to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}
