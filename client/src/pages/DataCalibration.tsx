/**
 * Data & Calibration — the honesty dashboard + the data-moat pipeline.
 *
 * Tab 1 Calibration: per-property calibration maturity (n matched trials,
 *   residual quantiles, bias) — the "trust progress bar" that motivates
 *   entering lab data.
 * Tab 2 Ingestion: paste batch cards / notebook pages / QC logs → LLM
 *   extraction → review each staged record → approve → commit. Nothing is
 *   ever auto-committed.
 */
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, XCircle, Database } from "lucide-react";

const MATURITY_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  calibrated: { label: "Calibrated (n≥30)", variant: "default" },
  blending: { label: "Blending (8–29)", variant: "secondary" },
  cold_start: { label: "Cold start (<8)", variant: "outline" },
};

function CalibrationTab() {
  const { data: stats, isLoading } = trpc.calibration.status.useQuery();

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calibration Status</CardTitle>
        <CardDescription>
          σ tightens as matched trial results accumulate per property. Cold-start properties use physics
          error bands or floored LLM intervals — labeled, never fabricated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!stats || stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matched prediction↔measurement pairs yet. Record trial results against predicted
            formulations (same test conditions) and calibration begins automatically.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Basis</TableHead>
                <TableHead className="text-right">n</TableHead>
                <TableHead className="text-right">Median |err|</TableHead>
                <TableHead className="text-right">q95 |err|</TableHead>
                <TableHead className="text-right">Bias</TableHead>
                <TableHead>Maturity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((row: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.propertyName}</TableCell>
                  <TableCell className="text-muted-foreground">{row.predictionBasis || "—"}</TableCell>
                  <TableCell className="text-right">{row.n}</TableCell>
                  <TableCell className="text-right">{row.medianAbsRelPct != null ? `${row.medianAbsRelPct}%` : "—"}</TableCell>
                  <TableCell className="text-right">{row.q95AbsRelPct != null ? `${row.q95AbsRelPct}%` : "—"}</TableCell>
                  <TableCell className={`text-right ${Math.abs(row.biasPct ?? 0) > 5 ? "text-amber-600 font-medium" : ""}`}>
                    {row.biasPct != null ? `${row.biasPct > 0 ? "+" : ""}${row.biasPct}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={MATURITY_BADGES[row.maturity]?.variant ?? "outline"}>
                      {MATURITY_BADGES[row.maturity]?.label ?? row.maturity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function IngestionTab() {
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState<string>("batch_card");
  const utils = trpc.useUtils();

  const { data: jobs } = trpc.ingestion.listJobs.useQuery();
  const { data: pending } = trpc.ingestion.listRecords.useQuery({ status: "pending_review" });
  const { data: approved } = trpc.ingestion.listRecords.useQuery({ status: "approved" });
  const { data: domains } = trpc.domains.list.useQuery();
  const { data: conditionSets } = trpc.testConditions.list.useQuery({});
  const [commitDomainId, setCommitDomainId] = useState("");
  const [commitConditionSetId, setCommitConditionSetId] = useState("");

  const start = trpc.ingestion.start.useMutation({
    onSuccess: r => {
      toast.success(`Extracted ${r.recordsExtracted} records — review them below`);
      setRawText("");
      utils.ingestion.invalidate();
    },
    onError: e => toast.error(`Extraction failed: ${e.message}`),
  });
  const review = trpc.ingestion.review.useMutation({
    onSuccess: () => utils.ingestion.invalidate(),
    onError: e => toast.error(e.message),
  });
  const commit = trpc.ingestion.commit.useMutation({
    onSuccess: r =>
      r.committed ? toast.success("Record committed with provenance") : toast.error(`Commit blocked: ${r.problem}`),
    onError: e => toast.error(e.message),
    onSettled: () => utils.ingestion.invalidate(),
  });

  const recordSummary = (record: any) => {
    const p = record.payload || {};
    const parts = [
      p.name ? `"${p.name}"` : null,
      p.components?.length ? `${p.components.length} components` : null,
      p.measurements?.length ? `${p.measurements.length} measurements` : null,
      p.date ? p.date : null,
    ].filter(Boolean);
    return parts.join(" · ");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Ingest Historical Data
          </CardTitle>
          <CardDescription>
            Paste batch cards, lab-notebook pages or QC logs. Records are extracted, STAGED, and only
            enter the database after your review — the calibration moat is only as good as its data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Source type</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="batch_card">Batch card</SelectItem>
                <SelectItem value="lab_notebook">Lab notebook</SelectItem>
                <SelectItem value="qc_log">QC log</SelectItem>
                <SelectItem value="trial_report">Trial report</SelectItem>
                <SelectItem value="spreadsheet">Spreadsheet text</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source text</Label>
            <Textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste the raw text of the batch card / notebook page here…"
              rows={8}
            />
          </div>
          <Button
            onClick={() => start.mutate({ sourceType: sourceType as any, rawText })}
            disabled={rawText.length < 50 || start.isPending}
          >
            {start.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Extract records
          </Button>
        </CardContent>
      </Card>

      {(pending?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Gate — {pending!.length} pending</CardTitle>
            <CardDescription>Approve only records you have verified against the source document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending!.map((record: any) => (
              <div key={record.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{recordSummary(record)}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      confidence {(parseFloat(record.confidence) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => review.mutate({ recordId: record.id, approve: true })}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => review.mutate({ recordId: record.id, approve: false })}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Extracted payload</summary>
                  <pre className="mt-2 overflow-x-auto max-h-64">{JSON.stringify(record.payload, null, 2)}</pre>
                </details>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(approved?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Commit — {approved!.length} approved</CardTitle>
            <CardDescription>
              Committing creates archived historical formulations/trials with provenance and feeds calibration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div>
                <Label>Domain</Label>
                <Select value={commitDomainId} onValueChange={setCommitDomainId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {(domains ?? []).map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Test condition set</Label>
                <Select value={commitConditionSetId} onValueChange={setCommitConditionSetId}>
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Conditions the measurements were taken under" />
                  </SelectTrigger>
                  <SelectContent>
                    {(conditionSets ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {approved!.map((record: any) => (
              <div key={record.id} className="border rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm">{recordSummary(record)}</span>
                <Button
                  size="sm"
                  disabled={!commitDomainId || !commitConditionSetId || commit.isPending}
                  onClick={() =>
                    commit.mutate({ recordId: record.id, domainId: commitDomainId, testConditionSetId: commitConditionSetId })
                  }
                >
                  <Database className="h-4 w-4 mr-1" /> Commit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(jobs?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs!.slice(0, 10).map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.sourceType}</TableCell>
                    <TableCell>
                      <Badge variant={job.status === "committed" ? "default" : job.status === "failed" ? "outline" : "secondary"}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DataCalibration() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Data & Calibration</h1>
          <p className="text-muted-foreground">
            Prediction honesty status and the historical-data ingestion pipeline
          </p>
        </div>
        <Tabs defaultValue="calibration">
          <TabsList>
            <TabsTrigger value="calibration">Calibration Status</TabsTrigger>
            <TabsTrigger value="ingestion">Data Ingestion</TabsTrigger>
          </TabsList>
          <TabsContent value="calibration" className="mt-4">
            <CalibrationTab />
          </TabsContent>
          <TabsContent value="ingestion" className="mt-4">
            <IngestionTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
