import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Beaker, Building2, FlaskConical, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { createTour, hasTourBeenCompleted, markTourAsCompleted } from "@/lib/tour";
import { MapIcon } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: materials, refetch: refetchMaterials } = trpc.materials.list.useQuery();
  const { data: suppliers, refetch: refetchSuppliers } = trpc.suppliers.list.useQuery();
  const { data: formulations, refetch: refetchFormulations } = trpc.formulations.listFamilies.useQuery();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const clearAllData = trpc.demo.clearAllData.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetchMaterials();
        refetchSuppliers();
        refetchFormulations();
      } else {
        toast.error(data.message);
      }
      setIsClearing(false);
    },
    onError: (error) => {
      toast.error(`Failed to clear data: ${error.message}`);
      setIsClearing(false);
    },
  });

  const seedDemoData = trpc.demo.seedData.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        // Refresh all data
        refetchMaterials();
        refetchSuppliers();
        refetchFormulations();
      } else {
        toast.error(data.message);
      }
      setIsSeeding(false);
    },
    onError: (error) => {
      toast.error(`Failed to load demo data: ${error.message}`);
      setIsSeeding(false);
    },
  });

  const handleLoadDemoData = () => {
    setIsSeeding(true);
    seedDemoData.mutate();
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to delete ALL workspace data? This cannot be undone.")) {
      setIsClearing(true);
      clearAllData.mutate();
    }
  };

  const handleStartTour = () => {
    const tour = createTour();
    tour.on("complete", markTourAsCompleted);
    tour.on("cancel", markTourAsCompleted);
    tour.start();
  };

  useEffect(() => {
    // Auto-start tour for first-time users after a delay
    if (user && !hasTourBeenCompleted()) {
      const timer = setTimeout(() => {
        handleStartTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const isEmpty = (materials?.length || 0) === 0 && (suppliers?.length || 0) === 0 && (formulations?.length || 0) === 0;
  const isAdmin = user?.role === 'admin';
  const showDemoButton = isEmpty || isAdmin; // Always show for admins

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ALKEMI™ Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Enterprise formulation intelligence platform for R&D teams
            </p>
          </div>
          {showDemoButton && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleLoadDemoData}
                disabled={isSeeding || isClearing}
                size="lg"
                variant="gradient"
                data-tour="load-demo-data"
                className="w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {isSeeding ? "Loading..." : "Load Demo Data"}
              </Button>
              {isAdmin && (
                <Button 
                  onClick={handleClearData}
                  disabled={isSeeding || isClearing}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isClearing ? "Clearing..." : "Reset Workspace"}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3" data-tour="stats-cards">
          {stats.map((stat, index) => {
            const gradients = ['gradient-primary', 'gradient-secondary', 'gradient-accent'];
            return (
              <Link key={stat.title} href={stat.href}>
                <Card className="hover-lift glass border-0 overflow-hidden relative group">
                  <div className={`absolute inset-0 ${gradients[index]} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-foreground">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${gradients[index]}`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2" data-tour="getting-started-section">
          <Card data-tour="quick-actions" className="glass border-0 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">Quick Actions</span>
                <Sparkles className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Common tasks and workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/materials">
                <Button variant="outline" className="w-full justify-start transition-smooth hover:border-primary/50 hover:bg-primary/5 group">
                  <div className="p-1.5 rounded-md gradient-primary mr-3">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform">Add New Material</span>
                </Button>
              </Link>
              <Link href="/formulations">
                <Button variant="outline" className="w-full justify-start transition-smooth hover:border-primary/50 hover:bg-primary/5 group">
                  <div className="p-1.5 rounded-md gradient-secondary mr-3">
                    <FlaskConical className="h-4 w-4 text-white" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform">Create Formulation</span>
                </Button>
              </Link>
              <Link href="/suppliers">
                <Button variant="outline" className="w-full justify-start transition-smooth hover:border-primary/50 hover:bg-primary/5 group">
                  <div className="p-1.5 rounded-md gradient-accent mr-3">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform">Add Supplier</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass border-0 hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">Getting Started</span>
                    <Beaker className="h-5 w-5 text-primary" />
                  </CardTitle>
                  <CardDescription>Set up your formulation workspace</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleStartTour} className="transition-smooth hover:border-primary/50 hover:bg-primary/5">
                  <MapIcon className="mr-2 h-4 w-4" />
                  Start Tour
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Add Materials</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Build your materials library with properties and suppliers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-secondary text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Create Formulations</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Design formulations with version control and branching
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-accent text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Run Predictions</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
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
