import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber, ConfidenceMeter } from "@/components/AnimatedProgressBar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface TechnicalParameter {
  value: string;
  unit: string;
  confidence: number;
}

interface AnalysisChartsProps {
  technicalParameters: Record<string, TechnicalParameter>;
  testMethods: string[];
  criticalProperties: string[];
  specifications?: Record<string, { min?: number; max?: number; target?: number }>;
}

// Color palette for charts
const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

const CONFIDENCE_COLORS = {
  high: "#10b981",    // green for >80%
  medium: "#f59e0b",  // amber for 60-80%
  low: "#ef4444",     // red for <60%
};

/**
 * Confidence Distribution Chart - Bar chart showing confidence levels for each parameter
 */
export function ConfidenceDistributionChart({ technicalParameters }: { technicalParameters: Record<string, TechnicalParameter> }) {
  const [zoomedData, setZoomedData] = useState<any[] | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const data = useMemo(() => {
    return Object.entries(technicalParameters)
      .map(([name, param]) => ({
        name: name.length > 20 ? name.substring(0, 20) + "..." : name,
        fullName: name,
        confidence: Math.round(param.confidence * 100),
        fill: param.confidence >= 0.8 
          ? CONFIDENCE_COLORS.high 
          : param.confidence >= 0.6 
          ? CONFIDENCE_COLORS.medium 
          : CONFIDENCE_COLORS.low,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 parameters
  }, [technicalParameters]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Parameter Confidence Distribution</CardTitle>
        <CardDescription>Confidence levels for extracted technical parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass border rounded-lg shadow-xl p-4 animate-in fade-in zoom-in duration-200">
                      <p className="font-semibold text-sm mb-1">{data.fullName}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.fill }} />
                        <p className="text-sm text-muted-foreground">
                          Confidence: <span className="font-bold text-foreground">{data.confidence}%</span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Click to zoom</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="confidence" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CONFIDENCE_COLORS.high }} />
            <span className="text-xs text-muted-foreground">High (≥80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CONFIDENCE_COLORS.medium }} />
            <span className="text-xs text-muted-foreground">Medium (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CONFIDENCE_COLORS.low }} />
            <span className="text-xs text-muted-foreground">Low (&lt;60%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Test Method Coverage Chart - Pie chart showing distribution of test method types
 */
export function TestMethodCoverageChart({ testMethods }: { testMethods: string[] }) {
  const data = useMemo(() => {
    const categories: Record<string, number> = {
      "ASTM": 0,
      "ISO": 0,
      "EPA": 0,
      "DIN": 0,
      "EN": 0,
      "Other": 0,
    };

    testMethods.forEach((method) => {
      if (method.toUpperCase().includes("ASTM")) categories["ASTM"]++;
      else if (method.toUpperCase().includes("ISO")) categories["ISO"]++;
      else if (method.toUpperCase().includes("EPA")) categories["EPA"]++;
      else if (method.toUpperCase().includes("DIN")) categories["DIN"]++;
      else if (method.toUpperCase().includes("EN")) categories["EN"]++;
      else categories["Other"]++;
    });

    return Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }));
  }, [testMethods]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Test Method Coverage</CardTitle>
        <CardDescription>Distribution of test standards used in analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = ((data.value / testMethods.length) * 100).toFixed(1);
                  return (
                    <div className="glass border rounded-lg shadow-xl p-4 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                        <p className="font-semibold text-sm">{data.name} Standards</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Count: <span className="font-bold text-foreground">{data.value}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {percentage}% of total methods
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <Badge variant="secondary" className="text-sm">
            {testMethods.length} Total Test Methods
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Critical Properties Radar Chart - Shows coverage across key property categories
 */
export function CriticalPropertiesRadarChart({ criticalProperties }: { criticalProperties: string[] }) {
  const data = useMemo(() => {
    const categories = [
      { name: "Corrosion", keywords: ["corrosion", "rust", "oxidation"] },
      { name: "Adhesion", keywords: ["adhesion", "bonding", "attachment"] },
      { name: "Durability", keywords: ["durability", "hardness", "abrasion", "wear"] },
      { name: "Appearance", keywords: ["gloss", "color", "appearance", "finish"] },
      { name: "Chemical", keywords: ["chemical", "solvent", "resistance"] },
      { name: "Environmental", keywords: ["uv", "weather", "humidity", "temperature"] },
    ];

    return categories.map((cat) => {
      const matchCount = criticalProperties.filter((prop) =>
        cat.keywords.some((kw) => prop.toLowerCase().includes(kw))
      ).length;
      return {
        category: cat.name,
        value: Math.min(matchCount * 25, 100), // Scale to 0-100
        fullMark: 100,
      };
    });
  }, [criticalProperties]);

  if (criticalProperties.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Property Coverage Analysis</CardTitle>
        <CardDescription>Coverage across key performance categories</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar
              name="Coverage"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3">
                      <p className="font-medium text-sm">{data.category}</p>
                      <p className="text-sm text-muted-foreground">
                        Coverage: <span className="font-medium">{data.value}%</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Confidence Summary Stats
 */
export function ConfidenceSummaryStats({ technicalParameters }: { technicalParameters: Record<string, TechnicalParameter> }) {
  const stats = useMemo(() => {
    const confidences = Object.values(technicalParameters).map((p) => p.confidence);
    if (confidences.length === 0) return null;

    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const high = confidences.filter((c) => c >= 0.8).length;
    const medium = confidences.filter((c) => c >= 0.6 && c < 0.8).length;
    const low = confidences.filter((c) => c < 0.6).length;

    return {
      average: Math.round(avg * 100),
      high,
      medium,
      low,
      total: confidences.length,
    };
  }, [technicalParameters]);

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Analysis Summary</CardTitle>
        <CardDescription>Overview of extracted parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 glass rounded-lg hover-lift">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              <AnimatedNumber value={stats.total} />
            </p>
            <p className="text-sm text-muted-foreground">Parameters</p>
          </div>
          <div className="text-center p-4 glass rounded-lg hover-lift">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              <AnimatedNumber value={stats.average} suffix="%" />
            </p>
            <p className="text-sm text-muted-foreground">Avg Confidence</p>
          </div>
        </div>
        <div className="space-y-3 mt-4">
          <ConfidenceMeter 
            confidence={stats.high / stats.total} 
            label={`High Confidence (${stats.high} parameters)`}
          />
          <ConfidenceMeter 
            confidence={stats.medium / stats.total} 
            label={`Medium Confidence (${stats.medium} parameters)`}
          />
          <ConfidenceMeter 
            confidence={stats.low / stats.total} 
            label={`Low Confidence (${stats.low} parameters)`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Combined Analysis Charts Component
 */
export function AnalysisCharts({ technicalParameters, testMethods, criticalProperties }: AnalysisChartsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConfidenceSummaryStats technicalParameters={technicalParameters} />
        <TestMethodCoverageChart testMethods={testMethods} />
      </div>

      {/* Detailed Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConfidenceDistributionChart technicalParameters={technicalParameters} />
        <CriticalPropertiesRadarChart criticalProperties={criticalProperties} />
      </div>
    </div>
  );
}
