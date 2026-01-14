import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import dagre from "dagre";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, User, GitBranch, TrendingUp, TrendingDown, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import "reactflow/dist/style.css";

interface Version {
  id: string;
  versionNumber: string;
  status: string;
  branchType?: string | null;
  parentVersionId?: string | null;
  createdAt: Date | string;
  createdBy: string;
  notes?: string | null;
  changeReason?: string | null;
  componentCount?: number;
}

interface VersionTreeProps {
  versions: Version[];
  onVersionClick?: (versionId: string) => void;
  highlightVersionId?: string;
}

const nodeWidth = 280;
const nodeHeight = 140;

// Custom node component
function VersionNode({ data }: { data: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500/20 border-gray-500";
      case "in_review":
        return "bg-yellow-500/20 border-yellow-500";
      case "approved":
        return "bg-green-500/20 border-green-500";
      case "archived":
        return "bg-red-500/20 border-red-500";
      default:
        return "bg-muted border-border";
    }
  };

  const getBranchTypeColor = (branchType?: string | null) => {
    switch (branchType) {
      case "revision":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "variant":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      case "cost_reduction":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "customer_specific":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
      case "experimental":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Calculate diff with parent
  const parentVersion = data.parentVersion;
  const componentDiff =
    parentVersion &&
    data.componentCount !== undefined &&
    parentVersion.componentCount !== undefined
      ? data.componentCount - parentVersion.componentCount
      : null;
  const statusChanged = parentVersion && data.status !== parentVersion.status;

  const nodeContent = (
    <div
      className={`glass border-2 rounded-lg p-3 ${getStatusColor(data.status)} ${
        data.isHighlighted ? "ring-4 ring-primary ring-offset-2" : ""
      } hover:shadow-lg transition-all cursor-pointer`}
      style={{ width: nodeWidth, height: nodeHeight }}
    >
      <div className="space-y-2">
        {/* Version Number & Status */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{data.versionNumber}</span>
          <Badge variant="secondary" className="text-xs">
            {data.status}
          </Badge>
        </div>

        {/* Branch Type */}
        {data.branchType && (
          <div className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            <Badge variant="outline" className={`text-xs ${getBranchTypeColor(data.branchType)}`}>
              {data.branchType.replace(/_/g, " ")}
            </Badge>
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{new Date(data.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Notes Preview */}
        {data.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2" title={data.notes}>
            {data.notes}
          </p>
        )}

        {/* Change Reason Preview */}
        {data.changeReason && (
          <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-1" title={data.changeReason}>
            {data.changeReason}
          </p>
        )}
      </div>
    </div>
  );

  // If there's a parent, show tooltip with diff
  if (parentVersion) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{nodeContent}</TooltipTrigger>
          <TooltipContent side="right" className="glass max-w-sm">
            <div className="space-y-2 p-2">
              <div className="font-semibold text-sm">{data.versionNumber}</div>

              {/* Component Count Diff */}
              {componentDiff !== null && (
                <div className="flex items-center gap-2 text-xs">
                  {componentDiff > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        +{componentDiff} component{componentDiff !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : componentDiff < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">
                        {componentDiff} component{componentDiff !== -1 ? "s" : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No component changes</span>
                  )}
                </div>
              )}

              {/* Status Change */}
              {statusChanged && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Status: </span>
                  <span className="font-medium">{parentVersion.status}</span>
                  <span className="mx-1">→</span>
                  <span className="font-medium">{data.status}</span>
                </div>
              )}

              {/* Created Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(data.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{data.createdBy}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // No parent, just show the node without tooltip
  return nodeContent;
}

const nodeTypes = {
  versionNode: VersionNode,
};

// Auto-layout using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });

  return { nodes: layoutedNodes, edges };
};

export function VersionTree({ versions, onVersionClick, highlightVersionId }: VersionTreeProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = useCallback(async () => {
    if (!treeRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(treeRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `formulation-version-tree-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Version tree exported successfully");
    } catch (error) {
      console.error("Failed to export tree:", error);
      toast.error("Failed to export version tree");
    } finally {
      setIsExporting(false);
    }
  }, []);
  // Build nodes and edges from version data
  const { initialNodes, initialEdges } = useMemo(() => {
    // Create a map for quick parent lookup
    const versionMap = new Map(versions.map((v) => [v.id, v]));

    const nodes: Node[] = versions.map((version) => ({
      id: version.id,
      type: "versionNode",
      data: {
        ...version,
        isHighlighted: version.id === highlightVersionId,
        parentVersion: version.parentVersionId ? versionMap.get(version.parentVersionId) : null,
      },
      position: { x: 0, y: 0 }, // Will be set by dagre
    }));

    const edges: Edge[] = versions
      .filter((version) => version.parentVersionId)
      .map((version) => ({
        id: `${version.parentVersionId}-${version.id}`,
        source: version.parentVersionId!,
        target: version.id,
        type: "smoothstep",
        animated: version.status === "draft",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
          stroke: version.status === "draft" ? "#3b82f6" : "#64748b",
        },
      }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);

    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
  }, [versions, highlightVersionId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onVersionClick) {
        onVersionClick(node.id);
      }
    },
    [onVersionClick]
  );

  return (
    <div ref={treeRef} className="w-full h-[600px] glass rounded-lg border relative">
      {/* Export Button */}
      <button
        onClick={handleExportPNG}
        disabled={isExporting}
        className="absolute top-4 right-4 z-10 glass border rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export PNG"}
      </button>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.status) {
              case "draft":
                return "#6b7280";
              case "in_review":
                return "#eab308";
              case "approved":
                return "#22c55e";
              case "archived":
                return "#ef4444";
              default:
                return "#94a3b8";
            }
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass border rounded-lg p-3 space-y-2 text-xs">
        <div className="font-semibold mb-2">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>In Review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Archived</span>
        </div>
      </div>
    </div>
  );
}
