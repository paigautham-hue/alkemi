import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Brain, Search, Trash2, ExternalLink, Clock, CheckCircle, AlertCircle, TrendingUp, Database, Lightbulb, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MEMORY_CATEGORIES = [
  { value: "formulation_insight", label: "Formulation Insight", color: "bg-blue-500" },
  { value: "material_property", label: "Material Property", color: "bg-green-500" },
  { value: "process_parameter", label: "Process Parameter", color: "bg-purple-500" },
  { value: "trial_learning", label: "Trial Learning", color: "bg-orange-500" },
  { value: "supplier_intelligence", label: "Supplier Intelligence", color: "bg-cyan-500" },
  { value: "compliance_rule", label: "Compliance Rule", color: "bg-red-500" },
  { value: "troubleshooting", label: "Troubleshooting", color: "bg-yellow-500" },
  { value: "cost_optimization", label: "Cost Optimization", color: "bg-emerald-500" },
  { value: "quality_insight", label: "Quality Insight", color: "bg-indigo-500" },
] as const;

type MemoryCategory = typeof MEMORY_CATEGORIES[number]["value"];

interface Memory {
  id: number;
  fact: string;
  rationale?: string;
  category: string;
  citations?: Array<{ type: string; id: string; title: string; url?: string }>;
  tags?: string[];
  confidence: number;
  verifiedAt?: Date;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function MemoryCard({ memory, onDelete }: { memory: Memory; onDelete: () => void }) {
  const [showDetail, setShowDetail] = useState(false);
  const categoryInfo = MEMORY_CATEGORIES.find(c => c.value === memory.category);
  const citations = memory.citations || [];
  const tags = memory.tags || [];
  
  const confidenceColor = memory.confidence >= 0.8 
    ? "text-green-600" 
    : memory.confidence >= 0.5 
      ? "text-yellow-600" 
      : "text-red-600";

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetail(true)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={`${categoryInfo?.color} text-white text-xs`}>
                  {categoryInfo?.label || memory.category}
                </Badge>
                {memory.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className={`text-xs font-medium ${confidenceColor}`}>
                  {Math.round(memory.confidence * 100)}% confidence
                </span>
              </div>
              
              <p className="text-sm font-medium line-clamp-2 mb-2">{memory.fact}</p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(memory.createdAt).toLocaleDateString()}
                </span>
                {citations.length > 0 && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {citations.length} citation{citations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Memory Detail
            </DialogTitle>
            <DialogDescription>
              View complete memory information and citations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Fact</h4>
              <p className="text-sm">{memory.fact}</p>
            </div>
            
            {memory.rationale && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Rationale</h4>
                <p className="text-sm text-muted-foreground">{memory.rationale}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                <Badge variant="secondary" className={`${categoryInfo?.color} text-white`}>
                  {categoryInfo?.label || memory.category}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Confidence</h4>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${memory.confidence >= 0.8 ? 'bg-green-500' : memory.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${memory.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm">{Math.round(memory.confidence * 100)}%</span>
                </div>
              </div>
            </div>
            
            {citations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Citations</h4>
                <div className="space-y-2">
                  {citations.map((citation, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Badge variant="outline" className="text-xs">{citation.type}</Badge>
                      <span className="text-sm">{citation.title}</span>
                      {citation.url && (
                        <a href={citation.url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{memory.verifiedAt ? '✓' : '—'}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{memory.isValid ? '✓' : '✗'}</p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatsCards({ stats }: { stats: { totalMemories: number; byCategory: Record<string, number>; avgConfidence: number; recentlyVerified: number } | undefined }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalMemories}</p>
              <p className="text-xs text-muted-foreground">Total Memories</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(stats.avgConfidence * 100)}%</p>
              <p className="text-xs text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.recentlyVerified}</p>
              <p className="text-xs text-muted-foreground">Recently Verified</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MemoryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { data: stats, refetch: refetchStats } = trpc.memory.stats.useQuery();
  
  const { data: memories, isLoading, refetch: refetchMemories } = trpc.memory.retrieve.useQuery({
    query: searchQuery || "",
    category: selectedCategory !== "all" ? selectedCategory as MemoryCategory : undefined,
    maxResults: 50,
  });
  
  const deleteMutation = trpc.memory.cleanup.useMutation({
    onSuccess: () => {
      toast.success("Memory cleanup completed");
      refetchMemories();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Failed to cleanup: ${error.message}`);
    },
  });

  const handleRefresh = () => {
    refetchMemories();
    refetchStats();
    toast.success("Memories refreshed");
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Memory Management
            </h1>
            <p className="text-muted-foreground">
              View and manage AI-learned formulation insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm("This will remove low-confidence memories older than 30 days. Continue?")) {
                  deleteMutation.mutate({ olderThanDays: 30 });
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup Old
            </Button>
          </div>
        </div>

        <StatsCards stats={stats} />

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {MEMORY_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : memories && memories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((memory: Memory) => (
              <MemoryCard 
                key={memory.id} 
                memory={memory}
                onDelete={() => {
                  toast.info("Individual memory deletion coming soon");
                }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No memories found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Memories will be automatically created as you use AI features like Reverse Engineering"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
