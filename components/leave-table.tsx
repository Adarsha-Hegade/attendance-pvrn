'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { LeaveTypeBadge } from "@/components/leave-type-badge"
import { format } from "date-fns"

export function LeaveTable({ leaves }: { leaves: any[] }) {
  if (!leaves || leaves.length === 0) {
      return <div className="text-center py-4 text-gray-500">No leave requests found.</div>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied On</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaves.map((leave) => (
          <TableRow key={leave.id}>
            <TableCell><LeaveTypeBadge type={leave.leave_type || 'casual'} /></TableCell>
            <TableCell className="max-w-[150px] truncate" title={leave.reason}>{leave.reason}</TableCell>
            <TableCell>{format(new Date(leave.start_date), 'MMM d, yyyy')}</TableCell>
            <TableCell>{format(new Date(leave.end_date), 'MMM d, yyyy')}</TableCell>
            <TableCell>{leave.days_count || '-'}</TableCell>
            <TableCell>
              <StatusBadge status={leave.status} />
            </TableCell>
             <TableCell>{format(new Date(leave.created_at), 'MMM d')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
