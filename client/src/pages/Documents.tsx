import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, Download, Trash2, Search, Filter, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DOC_TYPES = [
  { value: "tds", label: "Technical Data Sheet (TDS)" },
  { value: "msds", label: "Material Safety Data Sheet (MSDS)" },
  { value: "pds", label: "Product Data Sheet (PDS)" },
  { value: "sop", label: "Standard Operating Procedure (SOP)" },
  { value: "report", label: "Report" },
  { value: "lab_notebook", label: "Lab Notebook" },
  { value: "other", label: "Other" },
];

export default function Documents() {
  const { user, loading: authLoading } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<{
    title: string;
    docType: "tds" | "msds" | "pds" | "sop" | "report" | "lab_notebook" | "other";
    description: string;
  }>({
    title: "",
    docType: "tds",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [ragDialogOpen, setRagDialogOpen] = useState(false);
  const [ragQuestion, setRagQuestion] = useState("");
  const [ragAnswer, setRagAnswer] = useState<{ answer: string; sources: any[] } | null>(null);

  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery(
    { search: searchQuery, docType: filterType === "all" ? undefined : filterType },
    { enabled: !!user }
  );

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ title: "", docType: "tds", description: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const ragQueryMutation = trpc.documents.query.useMutation({
    onSuccess: (data) => {
      setRagAnswer(data);
    },
    onError: (error) => {
      toast.error(`Query failed: ${error.message}`);
    },
  });

  const handleRagQuery = () => {
    if (!ragQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }
    setRagAnswer(null);
    ragQueryMutation.mutate({ question: ragQuestion });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename
      if (!uploadForm.title) {
        setUploadForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await uploadMutation.mutateAsync({
          title: uploadForm.title,
          docType: uploadForm.docType,
          description: uploadForm.description,
          filename: selectedFile.name,
          fileData: base64,
          mimeType: selectedFile.type,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleDelete = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate({ documentId });
    }
  };

  const getDocTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      tds: "bg-blue-100 text-blue-800",
      msds: "bg-red-100 text-red-800",
      pds: "bg-green-100 text-green-800",
      sop: "bg-purple-100 text-purple-800",
      report: "bg-yellow-100 text-yellow-800",
      lab_notebook: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.other;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to access documents.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage technical documents, data sheets, and reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRagDialogOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Ask About Documents
          </Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload technical documents, data sheets, SOPs, and other files
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter document title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="docType">Document Type *</Label>
                <Select
                  value={uploadForm.docType}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, docType: value as typeof prev.docType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter document description (optional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DOC_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {isLoading ? (
        <div className="text-center py-12">Loading documents...</div>
      ) : !documents || documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first document to get started
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{doc.title}</CardTitle>
                      <Badge className={getDocTypeBadgeColor(doc.sourceType)}>
                        {DOC_TYPES.find(t => t.value === doc.sourceType)?.label || doc.sourceType}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Size: {formatFileSize(doc.fileSizeBytes || 0)}</span>
                      <span>•</span>
                      <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>File: {doc.filename}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.s3Url, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* RAG Query Dialog */}
      <Dialog open={ragDialogOpen} onOpenChange={setRagDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Ask About Your Documents
            </DialogTitle>
            <DialogDescription>
              Ask questions and get AI-powered answers from your document library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">Your Question</Label>
              <Textarea
                id="question"
                placeholder="e.g., What are the safety precautions for handling Material X?"
                value={ragQuestion}
                onChange={(e) => setRagQuestion(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleRagQuery} 
              disabled={ragQueryMutation.isPending}
              className="w-full"
            >
              {ragQueryMutation.isPending ? "Searching..." : "Search Documents"}
            </Button>
            
            {ragAnswer && (
              <div className="space-y-4 mt-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-2">Answer:</h4>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm whitespace-pre-wrap">{ragAnswer.answer}</p>
                  </div>
                </div>
                {ragAnswer.sources.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Sources:</h4>
                    <div className="space-y-2">
                      {ragAnswer.sources.map((source, idx) => (
                        <div key={idx} className="text-sm p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{source.document.title}</span>
                            <Badge variant="outline" className="ml-auto">
                              Score: {(source.score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs line-clamp-2">
                            {source.chunk.content.substring(0, 150)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRagDialogOpen(false);
              setRagQuestion("");
              setRagAnswer(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
