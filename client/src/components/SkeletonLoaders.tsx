import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton Card Component
export function SkeletonCard() {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

// Skeleton Table Component
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 flex-1 bg-muted animate-pulse rounded" />
        ))}
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 flex-1 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton Chart Component
export function SkeletonChart() {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart bars */}
          <div className="flex items-end gap-2 h-48">
            {[60, 80, 45, 90, 70, 55].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-primary/20 to-primary/10 animate-pulse rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          {/* Chart labels */}
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 h-3 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton Stats Grid
export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton Product List (for Reverse Engineering)
export function SkeletonProductList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="glass">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton Analysis Panel
export function SkeletonAnalysisPanel() {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="h-7 w-1/2 bg-muted animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs skeleton */}
        <div className="flex gap-2 border-b pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-40 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
