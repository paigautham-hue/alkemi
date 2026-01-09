import { nanoid } from "nanoid";
import * as db from "./db";

/**
 * Approval Workflow State Machine
 * 
 * States: draft → submitted → in_review → approved/rejected
 * 
 * Transitions:
 * - draft → submitted (by chemist)
 * - submitted → in_review (by manager)
 * - in_review → approved (by manager)
 * - in_review → rejected (by manager)
 * - in_review → revision_requested (by manager)
 * - revision_requested → submitted (by chemist after revisions)
 */

export type ApprovalStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "revision_requested"
  | "approved"
  | "rejected";

export type ApprovalAction =
  | "submit"
  | "start_review"
  | "approve"
  | "reject"
  | "request_revision"
  | "resubmit";

// Valid state transitions
const STATE_TRANSITIONS: Record<ApprovalStatus, ApprovalAction[]> = {
  draft: ["submit"],
  submitted: ["start_review"],
  in_review: ["approve", "reject", "request_revision"],
  revision_requested: ["resubmit"],
  approved: [],
  rejected: [],
};

export function canTransition(
  currentStatus: ApprovalStatus,
  action: ApprovalAction
): boolean {
  const allowedActions = STATE_TRANSITIONS[currentStatus] || [];
  return allowedActions.includes(action);
}

export function getNextStatus(action: ApprovalAction): ApprovalStatus {
  const actionToStatus: Record<ApprovalAction, ApprovalStatus> = {
    submit: "submitted",
    start_review: "in_review",
    approve: "approved",
    reject: "rejected",
    request_revision: "revision_requested",
    resubmit: "submitted",
  };
  return actionToStatus[action];
}

export interface CreateApprovalRequestParams {
  organizationId: string;
  formulationVersionId: string;
  requestedBy: string;
  reviewers: string[]; // user IDs of reviewers
  comments?: string;
}

export interface ReviewApprovalParams {
  approvalRequestId: string;
  reviewerId: string;
  action: "approve" | "reject" | "request_revision";
  comments: string;
}

export async function createApprovalRequest(
  params: CreateApprovalRequestParams
): Promise<string> {
  const requestId = nanoid();

  // Create approval request
  await db.createApprovalRequest({
    id: requestId,
    organizationId: params.organizationId,
    formulationVersionId: params.formulationVersionId,
    requestedBy: params.requestedBy,
    status: "submitted",
    reviewers: params.reviewers,
    submittedAt: new Date(),
  });

  // Create initial review record with comments
  if (params.comments) {
    await db.createApprovalReview({
      id: nanoid(),
      approvalRequestId: requestId,
      reviewerId: params.requestedBy,
      action: "submit",
      comments: params.comments,
      reviewedAt: new Date(),
    });
  }

  return requestId;
}

export async function reviewApproval(
  params: ReviewApprovalParams
): Promise<void> {
  // Get current approval request
  const request = await db.getApprovalRequest(params.approvalRequestId);
  if (!request) {
    throw new Error("Approval request not found");
  }

  // Validate transition
  if (!canTransition(request.status as ApprovalStatus, params.action)) {
    throw new Error(
      `Invalid transition: cannot ${params.action} from ${request.status}`
    );
  }

  // Get next status
  const nextStatus = getNextStatus(params.action);

  // Update approval request status
  await db.updateApprovalRequestStatus(params.approvalRequestId, nextStatus);

  // Create review record
  await db.createApprovalReview({
    id: nanoid(),
    approvalRequestId: params.approvalRequestId,
    reviewerId: params.reviewerId,
    action: params.action,
    comments: params.comments,
    reviewedAt: new Date(),
  });

  // If approved or rejected, set completed timestamp
  if (nextStatus === "approved" || nextStatus === "rejected") {
    await db.completeApprovalRequest(
      params.approvalRequestId,
      new Date()
    );
  }
}

export async function requestRevision(
  approvalRequestId: string,
  reviewerId: string,
  comments: string
): Promise<void> {
  await reviewApproval({
    approvalRequestId,
    reviewerId,
    action: "request_revision",
    comments,
  });
}

export async function resubmitAfterRevision(
  approvalRequestId: string,
  userId: string,
  comments: string
): Promise<void> {
  const request = await db.getApprovalRequest(approvalRequestId);
  if (!request) {
    throw new Error("Approval request not found");
  }

  if (request.status !== "revision_requested") {
    throw new Error("Can only resubmit from revision_requested status");
  }

  // Update status to submitted
  await db.updateApprovalRequestStatus(approvalRequestId, "submitted");

  // Create review record
  await db.createApprovalReview({
    id: nanoid(),
    approvalRequestId,
    reviewerId: userId,
    action: "resubmit",
    comments,
    reviewedAt: new Date(),
  });
}

export async function getApprovalHistory(
  approvalRequestId: string
): Promise<any[]> {
  return await db.getApprovalReviews(approvalRequestId);
}

export async function getPendingApprovals(
  organizationId: string,
  reviewerId?: string
): Promise<any[]> {
  return await db.getPendingApprovalRequests(organizationId, reviewerId);
}
