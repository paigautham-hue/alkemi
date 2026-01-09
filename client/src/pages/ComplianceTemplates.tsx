import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Shield, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ComplianceTemplates() {
  const { data: templates, isLoading } = trpc.compliance.listTemplates.useQuery();
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const activateTemplate = trpc.compliance.activateTemplate.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      setActivatingId(null);
    },
    onError: (error) => {
      toast.error(`Failed to activate template: ${error.message}`);
      setActivatingId(null);
    },
  });

  const handleActivate = (templateId: string) => {
    setActivatingId(templateId);
    activateTemplate.mutate({ templateId });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Rule Templates</h1>
          <p className="text-muted-foreground mt-2">
            Pre-configured compliance rules for major regulations. Activate templates to apply rules to your formulations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {templates?.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.jurisdiction}</CardDescription>
                  </div>
                  <Badge variant="outline">{template.rules.length} rules</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{template.description}</p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Included Rules:</p>
                  <div className="space-y-1">
                    {template.rules.slice(0, 3).map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{rule.ruleName}</span>
                      </div>
                    ))}
                    {template.rules.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        +{template.rules.length - 3} more rules
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => handleActivate(template.id)}
                    disabled={activatingId === template.id}
                    className="flex-1"
                  >
                    {activatingId === template.id ? "Activating..." : "Activate Template"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(template.sourceUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates && templates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No compliance templates available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
