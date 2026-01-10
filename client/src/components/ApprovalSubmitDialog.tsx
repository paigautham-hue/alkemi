import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ApprovalSubmitDialogProps {
  versionId: string;
  formulationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ApprovalSubmitDialog({
  versionId,
  formulationName,
  open,
  onOpenChange,
  onSuccess,
}: ApprovalSubmitDialogProps) {
  const [comments, setComments] = useState("");

  const submitMutation = trpc.approvals.create.useMutation({
    onSuccess: () => {
      toast.success("Formulation submitted for approval!");
      setComments("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Submission failed: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate({
      formulationVersionId: versionId,
      reviewers: [], // Empty array means auto-assign to all managers/admins
      comments: comments.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit for Approval</DialogTitle>
          <DialogDescription>
            Submit <strong>{formulationName}</strong> for review and approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This formulation will be submitted to all managers and admins in your organization for review.
            </AlertDescription>
          </Alert>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any notes or context for the reviewers..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
