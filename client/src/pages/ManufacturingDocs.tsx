import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function ManufacturingDocs() {
  const [selectedFormulation, setSelectedFormulation] = useState("");
  const [batchSize, setBatchSize] = useState("1000");
  const [batchUnit, setBatchUnit] = useState("kg");
  const [documentType, setDocumentType] = useState<"sop" | "batch_process" | "process_flow_diagram">("sop");
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);

  const formulationsQuery = trpc.formulations.listFamilies.useQuery({});
  const generateSOPMutation = trpc.manufacturingDocs.generateSOP.useMutation();
  const generateBatchProcessMutation = trpc.manufacturingDocs.generateBatchProcess.useMutation();
  const generateProcessFlowMutation = trpc.manufacturingDocs.generateProcessFlowDiagram.useMutation();
  const documentsQuery = trpc.manufacturingDocs.listDocuments.useQuery({});

  const handleGenerate = async () => {
    if (!selectedFormulation) {
      toast.error("Please select a formulation");
      return;
    }

    const batchSizeNum = parseFloat(batchSize);
    if (isNaN(batchSizeNum) || batchSizeNum <= 0) {
      toast.error("Please enter a valid batch size");
      return;
    }

    try {
      let result;
      if (documentType === "sop") {
        result = await generateSOPMutation.mutateAsync({
          formulationVersionId: selectedFormulation,
          batchSize: batchSizeNum,
          batchUnit,
        });
      } else if (documentType === "batch_process") {
        result = await generateBatchProcessMutation.mutateAsync({
          formulationVersionId: selectedFormulation,
          batchSize: batchSizeNum,
          batchUnit,
        });
      } else {
        result = await generateProcessFlowMutation.mutateAsync({
          formulationVersionId: selectedFormulation,
        });
      }

      setGeneratedDoc(result);
      toast.success("Document generated successfully!");
      documentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate document");
    }
  };

  const isGenerating = generateSOPMutation.isPending || generateBatchProcessMutation.isPending || generateProcessFlowMutation.isPending;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manufacturing Documentation Generator</h1>
        <p className="text-muted-foreground">
          Generate SOPs, batch processes, and process flow diagrams for tech transfer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Generate Document</CardTitle>
              <CardDescription>Select formulation and document type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={(v: any) => setDocumentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sop">Standard Operating Procedure (SOP)</SelectItem>
                    <SelectItem value="batch_process">Batch Process Description</SelectItem>
                    <SelectItem value="process_flow_diagram">Process Flow Diagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Formulation</Label>
                <Select value={selectedFormulation} onValueChange={setSelectedFormulation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select formulation" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulationsQuery.data?.map((family: any) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {documentType !== "process_flow_diagram" && (
                <>
                  <div className="space-y-2">
                    <Label>Batch Size</Label>
                    <Input
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value)}
                      placeholder="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={batchUnit} onValueChange={setBatchUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="gal">gal</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedFormulation}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Previously generated documents</CardDescription>
            </CardHeader>
            <CardContent>
              {documentsQuery.isLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : documentsQuery.data && documentsQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {documentsQuery.data.slice(0, 5).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setGeneratedDoc(doc)}
                    >
                      <div className="font-medium text-sm">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.documentType.replace("_", " ")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No documents generated yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Document</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedDoc ? (
                <Tabs defaultValue="content">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    {generatedDoc.steps && <TabsTrigger value="steps">Steps</TabsTrigger>}
                    {generatedDoc.safetyPrecautions && <TabsTrigger value="safety">Safety</TabsTrigger>}
                    {generatedDoc.qualityCheckpoints && <TabsTrigger value="quality">Quality</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="content" className="mt-4">
                    <div className="prose max-w-none">
                      <h2>{generatedDoc.title}</h2>
                      <Streamdown>{generatedDoc.content || generatedDoc.generatedContent}</Streamdown>
                    </div>
                  </TabsContent>

                  {generatedDoc.steps && (
                    <TabsContent value="steps" className="mt-4">
                      <div className="space-y-4">
                        {generatedDoc.steps.map((step: any) => (
                          <Card key={step.stepNumber}>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Step {step.stepNumber}: {step.stepName}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{step.description}</p>
                              {step.duration && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Duration: {step.duration} minutes
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  )}

                  {generatedDoc.safetyPrecautions && (
                    <TabsContent value="safety" className="mt-4">
                      <ul className="list-disc pl-6 space-y-2">
                        {generatedDoc.safetyPrecautions.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </TabsContent>
                  )}

                  {generatedDoc.qualityCheckpoints && (
                    <TabsContent value="quality" className="mt-4">
                      <ul className="list-disc pl-6 space-y-2">
                        {generatedDoc.qualityCheckpoints.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </TabsContent>
                  )}
                </Tabs>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Generate a document to view it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
