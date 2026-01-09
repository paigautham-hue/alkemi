import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Beaker, Building2, FlaskConical, Package } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: materials } = trpc.materials.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: formulations } = trpc.formulations.listFamilies.useQuery();

  const stats = [
    {
      title: "Materials",
      value: materials?.length || 0,
      icon: Package,
      href: "/materials",
      description: "Active materials in library",
    },
    {
      title: "Suppliers",
      value: suppliers?.length || 0,
      icon: Building2,
      href: "/suppliers",
      description: "Qualified suppliers",
    },
    {
      title: "Formulations",
      value: formulations?.length || 0,
      icon: FlaskConical,
      href: "/formulations",
      description: "Formulation families",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ALKEMI™ Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Enterprise formulation intelligence platform for R&D teams
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/materials">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Add New Material
                </Button>
              </Link>
              <Link href="/formulations">
                <Button variant="outline" className="w-full justify-start">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Create Formulation
                </Button>
              </Link>
              <Link href="/suppliers">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Set up your formulation workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Add Materials</p>
                  <p className="text-muted-foreground text-xs">
                    Build your materials library with properties and suppliers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Create Formulations</p>
                  <p className="text-muted-foreground text-xs">
                    Design formulations with version control and branching
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Run Predictions</p>
                  <p className="text-muted-foreground text-xs">
                    Use AI to predict properties and optimize formulations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
