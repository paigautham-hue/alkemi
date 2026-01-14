# Approval Workflow Fix Notes

## Problem Analysis

The approval system has two separate use cases that were incorrectly merged into one function:

1. **Pending Reviews** - Approvals assigned TO me (where I'm the reviewer)
   - Should filter by `ar.assigned_to = ${userId}` OR show all if user is admin
   
2. **My Requests** - Approvals submitted BY me (where I'm the requester)
   - Should filter by `ar.requested_by = ${userId}`

Currently, `getPendingApprovalRequests` uses the `reviewerId` parameter incorrectly - it filters by `requested_by` when it should filter by `assigned_to` for pending reviews.

## Solution

Create two separate functions:
- `getPendingApprovalRequests(organizationId, userId)` - for reviews assigned to me
- `getMyApprovalRequests(organizationId, userId)` - for requests I submitted

## Implementation Steps

1. Create `getMyApprovalRequests` function in db.ts
2. Update `getPendingApprovalRequests` to filter by `assigned_to` instead of `requested_by`
3. Update routers.ts to call the correct function for each endpoint
