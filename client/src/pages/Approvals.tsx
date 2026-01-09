import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function Approvals() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "request_revision" | null>(null);
  const [reviewComments, setReviewComments] = useState("");

  const { data: pendingApprovals, isLoading: pendingLoading, refetch: refetchPending } = trpc.approvals.listPending.useQuery();
  const { data: myRequests, isLoading: myRequestsLoading, refetch: refetchMy } = trpc.approvals.listMyRequests.useQuery();

  const reviewMutation = trpc.approvals.review.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setSelectedRequest(null);
      setReviewAction(null);
      setReviewComments("");
      refetchPending();
      refetchMy();
    },
    onError: (error) => {
      toast.error(`Review failed: ${error.message}`);
    },
  });

  const handleReview = () => {
    if (!reviewAction || !selectedRequest) return;

    if (!reviewComments.trim()) {
      toast.error("Please provide comments");
      return;
    }

    reviewMutation.mutate({
      approvalRequestId: selectedRequest.id,
      action: reviewAction,
      comments: reviewComments,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; variant: any; label: string }> = {
      submitted: { icon: Clock, variant: "secondary", label: "Submitted" },
      in_review: { icon: AlertCircle, variant: "default", label: "In Review" },
      revision_requested: { icon: MessageSquare, variant: "outline", label: "Revision Requested" },
      approved: { icon: CheckCircle, variant: "default", label: "Approved" },
      rejected: { icon: XCircle, variant: "destructive", label: "Rejected" },
    };

    const config = variants[status] || variants.submitted;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Approval Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve formulation submissions
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingApprovals && pendingApprovals.length > 0 ? (
            <div className="grid gap-4">
              {pendingApprovals.map((request: any) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {request.formulation_product_name} - {request.formulation_version_name}
                        </CardTitle>
                        <CardDescription>
                          Requested by {request.requested_by_name} on{" "}
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setSelectedRequest(request);
                          setReviewAction("approve");
                        }}
                        disabled={request.status !== "submitted" && request.status !== "in_review"}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedRequest(request);
                          setReviewAction("reject");
                        }}
                        disabled={request.status !== "submitted" && request.status !== "in_review"}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setReviewAction("request_revision");
                        }}
                        disabled={request.status !== "submitted" && request.status !== "in_review"}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Request Revision
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {myRequestsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : myRequests && myRequests.length > 0 ? (
            <div className="grid gap-4">
              {myRequests.map((request: any) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {request.formulation_product_name} - {request.formulation_version_name}
                        </CardTitle>
                        <CardDescription>
                          Submitted on {new Date(request.submitted_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No approval requests yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={() => {
        setReviewAction(null);
        setReviewComments("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" && "Approve Formulation"}
              {reviewAction === "reject" && "Reject Formulation"}
              {reviewAction === "request_revision" && "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {selectedRequest.formulation_product_name} - {selectedRequest.formulation_version_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Comments *</Label>
              <Textarea
                id="comments"
                placeholder="Provide your review comments..."
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewAction(null);
                setReviewComments("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {reviewAction === "approve" && "Approve"}
                  {reviewAction === "reject" && "Reject"}
                  {reviewAction === "request_revision" && "Request Revision"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
