# Approval Workflow System - Comprehensive Fix Plan

**Date**: January 14, 2026  
**Status**: In Progress  
**Priority**: HIGH - Blocking feature

---

## Problem Summary

The approval workflow system has multiple schema mismatches between the database and code:

1. **Missing `reviewers` column**: Code references `ar.reviewers` but schema only has `assignedTo`
2. **Wrong column names**: Code uses `action` but schema uses `decision`
3. **Wrong timestamp columns**: Code uses `completed_at` but schema uses `reviewedAt`
4. **Incorrect data types**: Timestamps being passed as Date objects instead of milliseconds

---

## Database Schema (Source of Truth)

### approval_requests table
```typescript
{
  id: varchar(36) PRIMARY KEY
  organizationId: varchar(36) NOT NULL → organizations.id
  formulationVersionId: varchar(36) NOT NULL → formulation_versions.id
  status: enum('draft', 'submitted', 'in_review', 'revision_requested', 'approved', 'rejected') DEFAULT 'draft'
  requestedBy: varchar(36) NOT NULL → users.id
  assignedTo: varchar(36) NULLABLE → users.id  // Single reviewer, not array
  submittedAt: timestamp NULLABLE
  reviewedAt: timestamp NULLABLE
  createdAt: timestamp NOT NULL DEFAULT NOW()
  updatedAt: timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW()
}
```

### approval_reviews table
```typescript
{
  id: varchar(36) PRIMARY KEY
  approvalRequestId: varchar(36) NOT NULL → approval_requests.id
  reviewerId: varchar(36) NOT NULL → users.id
  decision: enum('approve', 'reject', 'request_revision') NOT NULL  // NOT 'action'
  comments: text NULLABLE
  createdAt: timestamp NOT NULL DEFAULT NOW()
  // NO reviewedAt column here
}
```

---

## Files to Fix

### 1. server/db.ts
**Functions to fix:**
- ✅ `createApprovalRequest()` - Fixed to use assignedTo, submittedAt
- ✅ `createApprovalReview()` - Fixed to use decision instead of action
- ✅ `completeApprovalRequest()` - Fixed to use reviewedAt instead of completed_at
- ❌ `getPendingApprovalRequests()` - Still references reviewers column (NEEDS FIX)
- ❓ `getApprovalRequest()` - Need to check
- ❓ `getApprovalReviews()` - Need to check
- ❓ `getApprovalRequestsByFormulation()` - Need to check

### 2. server/approvalWorkflow.ts
**Functions to fix:**
- ✅ `createApprovalRequest()` - Fixed to use assignedTo
- ✅ `createApprovalReview()` - Fixed to use decision
- ❌ `reviewApproval()` - Still uses action parameter (NEEDS FIX)
- ❌ `resubmitAfterRevision()` - Fixed but needs verification

### 3. server/routers.ts
**Procedures to fix:**
- ✅ `approvals.create` - Fixed to use assignedTo
- ❌ `approvals.review` - Input schema uses action (NEEDS FIX)
- ❓ `approvals.listPending` - Need to verify query
- ❓ `approvals.listMyRequests` - Need to verify query

### 4. client/src/components/ApprovalSubmitDialog.tsx
- ✅ Fixed to use assignedTo instead of reviewers

### 5. client/src/pages/Approvals.tsx
- ❓ Need to check if it expects correct data structure

---

## Fix Strategy

### Step 1: Fix Database Query Functions (server/db.ts)
1. Fix `getPendingApprovalRequests()` to remove reviewers reference
2. Verify `getApprovalRequest()` returns correct structure
3. Verify `getApprovalReviews()` returns correct structure
4. Verify `getApprovalRequestsByFormulation()` works correctly

### Step 2: Fix Workflow Logic (server/approvalWorkflow.ts)
1. Update `reviewApproval()` parameter from `action` to `decision`
2. Verify all state transitions work correctly
3. Ensure timestamps are properly set

### Step 3: Fix API Layer (server/routers.ts)
1. Update `approvals.review` input schema to use `decision` instead of `action`
2. Verify all queries return correct data structure
3. Test all approval procedures

### Step 4: Fix Frontend (client/)
1. Update Approvals.tsx to handle correct data structure
2. Verify ApprovalSubmitDialog works end-to-end
3. Test approval review UI

### Step 5: End-to-End Testing
1. Test approval submission
2. Test approval review (approve/reject/request_revision)
3. Test approval history display
4. Test state transitions
5. Verify multi-tenancy isolation

---

## Current Status

### ✅ Completed Fixes
- createApprovalRequest() - uses assignedTo, submittedAt
- createApprovalReview() - uses decision, no reviewedAt
- completeApprovalRequest() - uses reviewedAt
- ApprovalSubmitDialog - uses assignedTo

### ❌ Remaining Fixes
- getPendingApprovalRequests() - remove reviewers JSON_CONTAINS
- reviewApproval() - change action to decision
- approvals.review input schema - change action to decision
- Verify all queries work end-to-end

---

## Testing Checklist

- [ ] Submit approval request from formulation editor
- [ ] View pending approvals as manager/admin
- [ ] View my requests as chemist
- [ ] Approve a request
- [ ] Reject a request
- [ ] Request revision
- [ ] Resubmit after revision
- [ ] View approval history
- [ ] Verify state transitions
- [ ] Test multi-tenancy isolation

---

## Notes

- The schema uses **single reviewer** (`assignedTo`) not multiple reviewers array
- If we need multiple reviewers in the future, we'll need to add a junction table
- All timestamps should be stored as milliseconds (Date.getTime())
- Status enum: draft → submitted → in_review → (revision_requested | approved | rejected)
