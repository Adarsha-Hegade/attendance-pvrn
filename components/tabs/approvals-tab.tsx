'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { LeaveTypeBadge } from '@/components/leave-type-badge'
import { format } from 'date-fns'
import { Clock, CheckCircle, XCircle, AlertCircle, CheckCheck } from 'lucide-react'
import { approveLeave, rejectLeave } from '@/app/actions/leave'
import { toast } from 'sonner'

interface Leave {
  id: string
  leave_type: string
  reason: string
  start_date: string
  end_date: string
  days_count: number
  is_half_day?: boolean
  half_day_period?: string
  status: string
  created_at: string
  profiles: { full_name: string; email: string }
}

export function ApprovalsTab() {
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([])
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedApproveLeave, setSelectedApproveLeave] = useState<Leave | null>(null)
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRejectLeave, setSelectedRejectLeave] = useState<Leave | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    const { data: pending } = await supabase
      .from('leave_requests')
      .select('*, profiles(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    const { data: recent } = await supabase
      .from('leave_requests')
      .select('*, profiles(full_name)')
      .in('status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(10)

    setPendingLeaves(pending || [])
    setRecentLeaves(recent || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApproveClick = (leave: Leave) => {
    setSelectedApproveLeave(leave)
    setApproveDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedApproveLeave) return
    setActionLoading(selectedApproveLeave.id)
    
    const result = await approveLeave(selectedApproveLeave.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Leave approved successfully')
      fetchData()
    }
    setActionLoading(null)
    setApproveDialogOpen(false)
  }

  const handleRejectClick = (leave: Leave) => {
    setSelectedRejectLeave(leave)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedRejectLeave) return
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setActionLoading(selectedRejectLeave.id)
    
    const result = await rejectLeave(selectedRejectLeave.id, rejectReason)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Leave rejected')
      fetchData()
    }
    setActionLoading(null)
    setRejectDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-500">Review and process leave requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600 uppercase">Pending</p>
                <p className="text-3xl font-bold text-yellow-700">{pendingLeaves.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" /> Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingLeaves.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
              <p>All caught up! No pending requests.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-yellow-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{leave.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{leave.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <LeaveTypeBadge type={leave.leave_type || 'casual'} />
                        {leave.is_half_day && (
                          <Badge variant="outline" className="text-[10px]">
                            {leave.half_day_period === 'morning' ? 'AM' : 'PM'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate" title={leave.reason}>{leave.reason}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {leave.is_half_day ? '0.5' : leave.days_count || 1}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveClick(leave)}
                        disabled={actionLoading === leave.id}
                      >
                        {actionLoading === leave.id ? '...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(leave)}
                        disabled={actionLoading === leave.id}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Recent Decisions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {leave.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <span className="font-medium text-sm">{leave.profiles?.full_name}</span>
                    <div className="text-xs text-gray-500">
                      {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LeaveTypeBadge type={leave.leave_type || 'casual'} />
                  <Badge variant={leave.status === 'approved' ? 'default' : 'destructive'}>
                    {leave.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-green-500" />
              Approve Leave Request
            </DialogTitle>
            <DialogDescription>
              Please confirm that you want to approve this leave request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employee:</span>
                <span className="text-sm font-medium">{selectedApproveLeave?.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Leave Type:</span>
                <span className="text-sm font-medium capitalize">{selectedApproveLeave?.leave_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Dates:</span>
                <span className="text-sm font-medium">
                  {selectedApproveLeave && format(new Date(selectedApproveLeave.start_date), 'MMM d, yyyy')} - {selectedApproveLeave && format(new Date(selectedApproveLeave.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days:</span>
                <span className="text-sm font-medium">
                  {selectedApproveLeave?.is_half_day ? '0.5 (Half Day)' : selectedApproveLeave?.days_count}
                </span>
              </div>
              <div className="pt-2 border-t border-green-200">
                <span className="text-sm text-gray-600">Reason:</span>
                <p className="text-sm mt-1">{selectedApproveLeave?.reason}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={handleApproveConfirm} 
              disabled={actionLoading !== null}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Reject Leave Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employee:</span>
                <span className="text-sm font-medium">{selectedRejectLeave?.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Dates:</span>
                <span className="text-sm font-medium">
                  {selectedRejectLeave && format(new Date(selectedRejectLeave.start_date), 'MMM d')} - {selectedRejectLeave && format(new Date(selectedRejectLeave.end_date), 'MMM d')}
                </span>
              </div>
            </div>
            <label className="text-sm font-medium">
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Please provide a detailed reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={actionLoading !== null || !rejectReason.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
