import DashboardLayout from "@/components/DashboardLayout";
import { AnimatedPage } from "@/components/AnimatedPage";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, Trash2, Sparkles, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function PatentAnalyzer() {
  const [selectedPatentId, setSelectedPatentId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: patents, isLoading, refetch } = trpc.patents.list.useQuery();
  const { data: selectedPatent } = trpc.patents.get.useQuery(
    { id: selectedPatentId! },
    { enabled: !!selectedPatentId }
  );
  const { data: analysis } = trpc.patents.getAnalysis.useQuery(
    { patentId: selectedPatentId! },
    { enabled: !!selectedPatentId }
  );

  const createPatentMutation = trpc.patents.create.useMutation({
    onSuccess: () => {
      toast.success("Patent added successfully");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add patent: ${error.message}`);
    },
  });

  const analyzePatentMutation = trpc.patents.analyze.useMutation({
    onSuccess: () => {
      toast.success("Patent analyzed successfully");
      setIsAnalyzing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
      setIsAnalyzing(false);
    },
  });

  const deletePatentMutation = trpc.patents.delete.useMutation({
    onSuccess: () => {
      toast.success("Patent deleted");
      setSelectedPatentId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleAddPatent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createPatentMutation.mutate({
      title: formData.get("title") as string,
      patentNumber: formData.get("patentNumber") as string || undefined,
      publicationDate: formData.get("publicationDate") as string || undefined,
      inventors: (formData.get("inventors") as string)?.split(",").map(s => s.trim()).filter(Boolean) || undefined,
      assignee: formData.get("assignee") as string || undefined,
      abstract: formData.get("abstract") as string || undefined,
      fullText: formData.get("fullText") as string || undefined,
      sourceUrl: formData.get("sourceUrl") as string || undefined,
    });
  };

  const handleAnalyze = () => {
    if (!selectedPatentId) return;
    setIsAnalyzing(true);
    analyzePatentMutation.mutate({ patentId: selectedPatentId });
  };

  const handleDelete = () => {
    if (!selectedPatentId) return;
    if (confirm("Are you sure you want to delete this patent?")) {
      deletePatentMutation.mutate({ id: selectedPatentId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Patent & Literature Analyzer</h1>
          <p className="text-muted-foreground mt-1">
            Extract chemistry, reaction mechanisms, and technology landscapes from patents
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAddPatent}>
              <DialogHeader>
                <DialogTitle>Add Patent</DialogTitle>
                <DialogDescription>
                  Add a new patent or research paper for analysis
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patentNumber">Patent Number</Label>
                    <Input id="patentNumber" name="patentNumber" placeholder="US1234567" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="publicationDate">Publication Date</Label>
                    <Input id="publicationDate" name="publicationDate" type="date" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inventors">Inventors (comma-separated)</Label>
                  <Input id="inventors" name="inventors" placeholder="John Doe, Jane Smith" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignee">Assignee/Company</Label>
                  <Input id="assignee" name="assignee" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="abstract">Abstract</Label>
                  <Textarea id="abstract" name="abstract" rows={3} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullText">Full Text *</Label>
                  <Textarea 
                    id="fullText" 
                    name="fullText" 
                    rows={6} 
                    required
                    placeholder="Paste the full patent text here for analysis..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sourceUrl">Source URL</Label>
                  <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPatentMutation.isPending}>
                  {createPatentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Patent
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Patents List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Patents ({patents?.length || 0})</CardTitle>
              <CardDescription>Select a patent to view analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {patents && patents.length > 0 ? (
                <div className="divide-y">
                  {patents.map((patent: any) => (
                    <button
                      key={patent.id}
                      onClick={() => setSelectedPatentId(patent.id)}
                      className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                        selectedPatentId === patent.id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{patent.title}</p>
                          {patent.patentNumber && (
                            <Badge variant="outline" className="mt-1">
                              {patent.patentNumber}
                            </Badge>
                          )}
                          {patent.assignee && (
                            <p className="text-xs text-muted-foreground mt-1">{patent.assignee}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No patents added yet</p>
                  <p className="text-sm mt-1">Click "Add Patent" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patent Details & Analysis */}
        <div className="col-span-8">
          {selectedPatent ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{selectedPatent.title}</CardTitle>
                    {selectedPatent.patentNumber && (
                      <CardDescription className="mt-1">
                        Patent No: {selectedPatent.patentNumber}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !selectedPatent.fullText}
                      size="sm"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {analysis ? "Re-analyze" : "Analyze"}
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
                    <TabsTrigger value="technology">Technology</TabsTrigger>
                    <TabsTrigger value="formulation">Formulation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    {selectedPatent.assignee && (
                      <div>
                        <Label>Assignee</Label>
                        <p className="text-sm mt-1">{selectedPatent.assignee}</p>
                      </div>
                    )}
                    {selectedPatent.publicationDate && (
                      <div>
                        <Label>Publication Date</Label>
                        <p className="text-sm mt-1">{selectedPatent.publicationDate}</p>
                      </div>
                    )}
                    {selectedPatent.abstract && (
                      <div>
                        <Label>Abstract</Label>
                        <p className="text-sm mt-1 text-muted-foreground">{selectedPatent.abstract}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="chemistry" className="space-y-4">
                    {analysis ? (
                      <>
                        {analysis.chemicalCompounds && JSON.parse(analysis.chemicalCompounds as string).length > 0 && (
                          <div>
                            <Label>Chemical Compounds</Label>
                            <div className="mt-2 space-y-2">
                              {JSON.parse(analysis.chemicalCompounds as string).map((compound: any, i: number) => (
                                <Card key={i}>
                                  <CardContent className="p-3">
                                    <p className="font-medium">{compound.name}</p>
                                    <p className="text-sm text-muted-foreground">Role: {compound.role}</p>
                                    {compound.cas && <p className="text-xs text-muted-foreground">CAS: {compound.cas}</p>}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                        {analysis.reactionMechanisms && JSON.parse(analysis.reactionMechanisms as string).length > 0 && (
                          <div>
                            <Label>Reaction Mechanisms</Label>
                            <div className="mt-2 space-y-2">
                              {JSON.parse(analysis.reactionMechanisms as string).map((mechanism: any, i: number) => (
                                <Card key={i}>
                                  <CardContent className="p-3">
                                    <p className="font-medium">{mechanism.type}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{mechanism.description}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click "Analyze" to extract chemistry data</p>
                    )}
                  </TabsContent>

                  <TabsContent value="technology" className="space-y-4">
                    {analysis ? (
                      <>
                        {analysis.technologyCategory && (
                          <div>
                            <Label>Technology Category</Label>
                            <p className="text-sm mt-1">{analysis.technologyCategory}</p>
                          </div>
                        )}
                        {analysis.keyInnovations && JSON.parse(analysis.keyInnovations as string).length > 0 && (
                          <div>
                            <Label>Key Innovations</Label>
                            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                              {JSON.parse(analysis.keyInnovations as string).map((innovation: string, i: number) => (
                                <li key={i}>{innovation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysis.marketApplications && JSON.parse(analysis.marketApplications as string).length > 0 && (
                          <div>
                            <Label>Market Applications</Label>
                            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                              {JSON.parse(analysis.marketApplications as string).map((app: string, i: number) => (
                                <li key={i}>{app}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click "Analyze" to extract technology landscape</p>
                    )}
                  </TabsContent>

                  <TabsContent value="formulation" className="space-y-4">
                    {analysis && analysis.formulationStrategies ? (
                      <div>
                        <Label>Formulation Strategies</Label>
                        <div className="mt-2 space-y-3">
                          {JSON.parse(analysis.formulationStrategies as string).map((strategy: any, i: number) => (
                            <Card key={i}>
                              <CardHeader>
                                <CardTitle className="text-base">{strategy.approach}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                {strategy.keyComponents && strategy.keyComponents.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium">Key Components:</p>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                                      {strategy.keyComponents.map((comp: string, j: number) => (
                                        <li key={j}>{comp}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {strategy.processingSteps && strategy.processingSteps.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium">Processing Steps:</p>
                                    <ol className="text-sm text-muted-foreground list-decimal list-inside">
                                      {strategy.processingSteps.map((step: string, j: number) => (
                                        <li key={j}>{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click "Analyze" to generate formulation strategies</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Select a patent to view details and analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </AnimatedPage>
    </DashboardLayout>
  );
}
