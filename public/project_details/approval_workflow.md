1. Employee submits leave
2. Status = pending
3. All approvers see it
4. First approver clicks Approve or Reject
5. System:
   - Writes to leave_actions
   - Updates leave_requests.status
6. Further actions are blocked
