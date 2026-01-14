import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Beaker, FileText, Target, TrendingUp, Trash2, Eye, BarChart3, Database, FileDown, FileSpreadsheet, FileJson, Download, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AnalysisProgressIndicator, AnalysisResultsSkeleton } from "@/components/AnalysisProgressIndicator";
import { AnalysisCharts } from "@/components/AnalysisCharts";
import { SkeletonProductList, SkeletonAnalysisPanel } from "@/components/SkeletonLoaders";

export default function ReverseEngineering() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [isBatchExporting, setIsBatchExporting] = useState(false);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.reverseEngineering.listCompetitorProducts.useQuery({});
  const { data: selectedProductData } = trpc.reverseEngineering.getCompetitorProduct.useQuery(
    { productId: selectedProduct! },
    { enabled: !!selectedProduct }
  );
  const { data: analyses } = trpc.reverseEngineering.listAnalyses.useQuery(
    { competitorProductId: selectedProduct! },
    { enabled: !!selectedProduct }
  );

  const createProduct = trpc.reverseEngineering.createCompetitorProduct.useMutation({
    onSuccess: () => {
      toast.success("Competitor product added successfully");
      setIsAddDialogOpen(false);
      utils.reverseEngineering.listCompetitorProducts.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });

  const analyzeProduct = trpc.reverseEngineering.analyzeProduct.useMutation({
    onSuccess: () => {
      toast.success("Analysis completed successfully");
      setIsAnalyzing(false);
      utils.reverseEngineering.getCompetitorProduct.invalidate();
      utils.reverseEngineering.listAnalyses.invalidate();
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
      setIsAnalyzing(false);
    },
  });

  const deleteProduct = trpc.reverseEngineering.deleteCompetitorProduct.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      setSelectedProduct(null);
      utils.reverseEngineering.listCompetitorProducts.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const seedTestProducts = trpc.reverseEngineering.seedTestProducts.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.reverseEngineering.listCompetitorProducts.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to seed test products: ${error.message}`);
    },
  });

  // Export mutations
  const exportPDF = trpc.reverseEngineering.exportPDF.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`PDF report downloaded: ${selectedProductData?.productName}`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportExcel = trpc.reverseEngineering.exportExcel.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Excel report downloaded: ${selectedProductData?.productName}`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const handleExportPDF = () => {
    if (selectedProduct) {
      exportPDF.mutate({ productId: selectedProduct });
    }
  };

  const handleExportExcel = () => {
    if (selectedProduct) {
      exportExcel.mutate({ productId: selectedProduct });
    }
  };

  const handleExportJSON = () => {
    if (selectedProductData && analyses) {
      const exportData = {
        product: selectedProductData,
        analyses: analyses,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ALKEMI_Analysis_${selectedProductData.productName.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`JSON data exported: ${selectedProductData.productName}`);
    }
  };

  // Batch export mutation
  const batchExport = trpc.reverseEngineering.batchExport.useMutation({
    onSuccess: (data) => {
      // Create and download a ZIP-like combined file or individual files
      data.files.forEach((file: { filename: string; content: string; type: string }) => {
        const mimeType = file.type === 'html' ? 'text/html' : file.type === 'csv' ? 'text/csv' : 'application/json';
        const blob = new Blob([file.content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      toast.success(`Exported ${data.count} product reports`);
      setSelectedForExport(new Set());
      setIsBatchExporting(false);
    },
    onError: (error) => {
      toast.error(`Batch export failed: ${error.message}`);
      setIsBatchExporting(false);
    },
  });

  const toggleProductSelection = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForExport(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    if (products) {
      const analyzedProducts = products.filter(p => p.analysisStatus === 'completed');
      setSelectedForExport(new Set(analyzedProducts.map(p => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedForExport(new Set());
  };

  const handleBatchExport = (format: 'pdf' | 'excel' | 'json') => {
    if (selectedForExport.size === 0) {
      toast.error('Please select at least one product to export');
      return;
    }
    setIsBatchExporting(true);
    batchExport.mutate({
      productIds: Array.from(selectedForExport),
      format,
    });
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const marketingClaimsText = formData.get("marketingClaims") as string;
    const marketingClaims = marketingClaimsText
      ? marketingClaimsText.split("\n").filter(claim => claim.trim())
      : [];

    createProduct.mutate({
      productName: formData.get("productName") as string,
      manufacturer: formData.get("manufacturer") as string,
      productCode: (formData.get("productCode") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      marketingClaims: marketingClaims.length > 0 ? marketingClaims : undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleAnalyze = (productId: string) => {
    setIsAnalyzing(true);
    analyzeProduct.mutate({ productId });
  };

  const performanceTranslation = analyses?.find(a => a.analysisType === "performance_translation");
  const formulationStrategy = analyses?.find(a => a.analysisType === "formulation_strategy");
  const tppAnalysis = analyses?.find(a => a.analysisType === "tpp_generation");

  // Extract data for charts
  const technicalParameters = (performanceTranslation?.results as any)?.technicalParameters || {};
  const testMethods = (performanceTranslation?.results as any)?.testMethods || [];
  const criticalProperties = (performanceTranslation?.results as any)?.criticalProperties || [];

  return (
    <DashboardLayout>
      <AnimatedPage>
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Reverse Engineering Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Analyze competitor products and generate formulation strategies
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => seedTestProducts.mutate()}
            disabled={seedTestProducts.isPending}
          >
            {seedTestProducts.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Load Test Products
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor Product
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Competitor Product</DialogTitle>
              <DialogDescription>
                Enter information about a competitor product to analyze
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input id="productName" name="productName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input id="manufacturer" name="manufacturer" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode">Product Code</Label>
                  <Input id="productCode" name="productCode" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Coating, Adhesive" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketingClaims">Marketing Claims (one per line)</Label>
                <Textarea
                  id="marketingClaims"
                  name="marketingClaims"
                  placeholder="High durability&#10;Fast drying&#10;Low VOC"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Products List */}
        <div className="col-span-4">
          <Card className="glass border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-primary" />
                    Competitor Products
                  </CardTitle>
                  <CardDescription>Select a product to view analysis</CardDescription>
                </div>
                {selectedForExport.size > 0 && (
                  <Badge className="gradient-primary text-white border-0 shadow-lg">
                    {selectedForExport.size} selected
                  </Badge>
                )}
              </div>
              {/* Batch Export Controls */}
              {products && products.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectedForExport.size === products.filter(p => p.analysisStatus === 'completed').length ? clearSelection : selectAllProducts}
                  >
                    {selectedForExport.size === products.filter(p => p.analysisStatus === 'completed').length ? (
                      <><Square className="h-4 w-4 mr-1" /> Deselect All</>
                    ) : (
                      <><CheckSquare className="h-4 w-4 mr-1" /> Select All</>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={selectedForExport.size === 0 || isBatchExporting}
                      >
                        {isBatchExporting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        Export ({selectedForExport.size})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBatchExport('pdf')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export as PDF (HTML)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBatchExport('excel')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export as Excel (CSV)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBatchExport('json')}>
                        <FileJson className="h-4 w-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <SkeletonProductList count={6} />
              ) : products && products.length > 0 ? (
                <div className="space-y-2">
                  {products.map((product) => {
                    const isSelected = selectedProduct === product.id;
                    const isExportSelected = selectedForExport.has(product.id);
                    const isCompleted = product.analysisStatus === 'completed';
                    const isAnalyzing = product.analysisStatus === 'analyzing';
                    
                    return (
                      <Card
                        key={product.id}
                        className={`cursor-pointer transition-smooth hover-lift relative overflow-hidden ${
                          isSelected ? "glass border-primary/50 shadow-lg" : "border-border/50"
                        } ${isExportSelected ? "ring-2 ring-primary shadow-primary/20" : ""}`}
                        onClick={() => setSelectedProduct(product.id)}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 gradient-primary opacity-5" />
                        )}
                        <CardContent className="p-4 relative z-10">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {isCompleted && (
                                <Checkbox
                                  checked={isExportSelected}
                                  onClick={(e) => toggleProductSelection(product.id, e)}
                                  className="mt-1"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{product.productName}</h3>
                                <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
                                {product.category && (
                                  <Badge variant="secondary" className="mt-2">
                                    {product.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {isCompleted && (
                              <Badge className="gradient-success text-white border-0 shadow-md ml-2">
                                Analyzed
                              </Badge>
                            )}
                            {isAnalyzing && (
                              <Badge variant="outline" className="ml-2 border-primary/50 bg-primary/5">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Analyzing
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No competitor products yet</p>
                  <p className="text-sm">Add one to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Details & Analysis */}
        <div className="col-span-8">
          {/* Analysis Progress Indicator */}
          {isAnalyzing && selectedProductData && (
            <div className="mb-6">
              <AnalysisProgressIndicator 
                isAnalyzing={isAnalyzing} 
                productName={selectedProductData.productName} 
              />
            </div>
          )}

          {selectedProduct && selectedProductData ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">
                  <Eye className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="technical">
                  <Beaker className="h-4 w-4 mr-2" />
                  Technical Analysis
                </TabsTrigger>
                <TabsTrigger value="charts" disabled={!performanceTranslation}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Visualizations
                </TabsTrigger>
                <TabsTrigger value="strategy">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Formulation Strategy
                </TabsTrigger>
                <TabsTrigger value="tpp">
                  <Target className="h-4 w-4 mr-2" />
                  Target Product Profile
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="glass border-0 hover-lift">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                          {selectedProductData.productName}
                        </CardTitle>
                        <CardDescription className="text-base mt-1">{selectedProductData.manufacturer}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {selectedProductData.analysisStatus !== "completed" && (
                          <Button
                            onClick={() => handleAnalyze(selectedProduct)}
                            disabled={isAnalyzing || selectedProductData.analysisStatus === "analyzing"}
                          >
                            {(isAnalyzing || selectedProductData.analysisStatus === "analyzing") && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Analyze Product
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this product?")) {
                              deleteProduct.mutate({ productId: selectedProduct });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedProductData.productCode && (
                      <div>
                        <Label>Product Code</Label>
                        <p className="text-sm">{selectedProductData.productCode}</p>
                      </div>
                    )}
                    {selectedProductData.category && (
                      <div>
                        <Label>Category</Label>
                        <p className="text-sm">{selectedProductData.category}</p>
                      </div>
                    )}
                    {selectedProductData.marketingClaims && Array.isArray(selectedProductData.marketingClaims) && (
                      <div>
                        <Label>Marketing Claims</Label>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          {(selectedProductData.marketingClaims as string[]).map((claim, i) => (
                            <li key={i}>{claim}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedProductData.notes && (
                      <div>
                        <Label>Notes</Label>
                        <p className="text-sm whitespace-pre-wrap">{selectedProductData.notes}</p>
                      </div>
                    )}
                    {selectedProductData.analysisStatus === "completed" && selectedProductData.confidenceScore && (
                      <div>
                        <Label>Analysis Confidence</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${parseFloat(selectedProductData.confidenceScore) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {(parseFloat(selectedProductData.confidenceScore) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Export Buttons */}
                    {selectedProductData.analysisStatus === "completed" && (
                      <div className="pt-4 border-t">
                        <Label className="mb-3 block">Export Analysis</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={exportPDF.isPending}
                          >
                            {exportPDF.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <FileDown className="h-4 w-4 mr-2" />
                            )}
                            Export PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            disabled={exportExcel.isPending}
                          >
                            {exportExcel.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                            )}
                            Export Excel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportJSON}
                          >
                            <FileJson className="h-4 w-4 mr-2" />
                            Export JSON
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Parameter Analysis</CardTitle>
                    <CardDescription>
                      Translated marketing claims into measurable technical parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAnalyzing ? (
                      <AnalysisResultsSkeleton />
                    ) : performanceTranslation ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-3">Technical Parameters</h3>
                          <div className="grid gap-4">
                            {Object.entries(technicalParameters).map(([param, data]: [string, any]) => (
                              <Card key={param}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{param}</h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {data.value} {data.unit}
                                      </p>
                                    </div>
                                    <Badge variant={data.confidence > 0.7 ? "default" : "secondary"}>
                                      {(data.confidence * 100).toFixed(0)}% confidence
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Test Methods</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {testMethods.map((method: string, i: number) => (
                              <li key={i} className="text-sm">
                                {method}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Critical Properties</h3>
                          <div className="flex flex-wrap gap-2">
                            {criticalProperties.map((prop: string, i: number) => (
                              <Badge key={i} variant="outline">
                                {prop}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No technical analysis available</p>
                        <p className="text-sm">Run analysis to generate insights</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="charts">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Analysis Visualizations</h2>
                      <p className="text-sm text-muted-foreground">
                        Interactive charts for analysis results
                      </p>
                    </div>
                  </div>
                  
                  {performanceTranslation ? (
                    <AnalysisCharts
                      technicalParameters={technicalParameters}
                      testMethods={testMethods}
                      criticalProperties={criticalProperties}
                    />
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <BarChart3 className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                          Run an analysis first to see interactive visualizations of the results.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="strategy">
                <Card>
                  <CardHeader>
                    <CardTitle>Formulation Strategy</CardTitle>
                    <CardDescription>
                      Recommended approach to match or exceed competitor product
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAnalyzing ? (
                      <AnalysisResultsSkeleton />
                    ) : formulationStrategy ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-2">Recommended Approach</h3>
                          <p className="text-sm">
                            {(formulationStrategy.results as any).recommendedApproach}
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Key Ingredient Categories</h3>
                          <div className="grid gap-4">
                            {((formulationStrategy.results as any).keyIngredientCategories || []).map(
                              (cat: any, i: number) => (
                                <Card key={i}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-medium">{cat.category}</h4>
                                      <Badge variant="secondary">{cat.typicalPercentage}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{cat.purpose}</p>
                                    <div className="flex flex-wrap gap-1">
                                      {cat.examples.map((ex: string, j: number) => (
                                        <Badge key={j} variant="outline" className="text-xs">
                                          {ex}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Processing Considerations</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {((formulationStrategy.results as any).processingConsiderations || []).map(
                              (item: string, i: number) => (
                                <li key={i} className="text-sm">
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Potential Challenges</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {((formulationStrategy.results as any).potentialChallenges || []).map(
                              (item: string, i: number) => (
                                <li key={i} className="text-sm text-orange-600">
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No formulation strategy available</p>
                        <p className="text-sm">Run analysis to generate strategy</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tpp">
                <Card>
                  <CardHeader>
                    <CardTitle>Target Product Profile (TPP)</CardTitle>
                    <CardDescription>
                      Comprehensive product specification for development
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAnalyzing ? (
                      <AnalysisResultsSkeleton />
                    ) : tppAnalysis ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Product Name</Label>
                            <p className="text-sm">{(tppAnalysis.results as any).productName}</p>
                          </div>
                          <div>
                            <Label>Target Market</Label>
                            <p className="text-sm">{(tppAnalysis.results as any).targetMarket}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Performance Requirements</h3>
                          <div className="grid gap-2">
                            {Object.entries((tppAnalysis.results as any).performanceRequirements || {}).map(
                              ([key, value]) => (
                                <div key={key} className="flex justify-between border-b pb-2">
                                  <span className="text-sm font-medium">{key}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Physical Properties</h3>
                          <div className="grid gap-2">
                            {Object.entries((tppAnalysis.results as any).physicalProperties || {}).map(
                              ([key, value]) => (
                                <div key={key} className="flex justify-between border-b pb-2">
                                  <span className="text-sm font-medium">{key}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Regulatory Requirements</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {((tppAnalysis.results as any).regulatoryRequirements || []).map(
                              (req: string, i: number) => (
                                <li key={i} className="text-sm">
                                  {req}
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Competitive Advantages</h3>
                          <div className="grid gap-2">
                            {((tppAnalysis.results as any).competitiveAdvantages || []).map(
                              (adv: string, i: number) => (
                                <Card key={i}>
                                  <CardContent className="p-3">
                                    <p className="text-sm">{adv}</p>
                                  </CardContent>
                                </Card>
                              )
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Cost Target</Label>
                          <p className="text-sm">{(tppAnalysis.results as any).costTarget}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No TPP available</p>
                        <p className="text-sm">Run analysis to generate TPP</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Beaker className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Product Selected</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Select a competitor product from the list to view its details and analysis, or add a new
                  product to get started.
                </p>
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
