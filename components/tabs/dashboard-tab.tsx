'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { Users, UserCheck, CalendarOff, Clock, X, Edit2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/status-badge'
import { LeaveTypeBadge } from '@/components/leave-type-badge'
import { cancelLeave } from '@/app/actions/leave'
import { toast } from 'sonner'

interface DashboardData {
  leaves: Array<{
    id: string
    leave_type: string
    reason: string
    start_date: string
    end_date: string
    days_count: number
    is_half_day?: boolean
    half_day_period?: string
    status: string
    rejection_reason?: string
    created_at: string
  }>
  balances: Array<{
    id: string
    leave_type: string
    allocated: number
    used: number
  }>
  stats: {
    totalEmployees: number
    onLeaveToday: number
  }
}

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
  rejection_reason?: string
  created_at: string
}

export function DashboardTab({ 
  userId, 
  isApprover
}: { 
  userId: string
  isApprover: boolean
}) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    
    const currentYear = new Date().getFullYear()
    const today = new Date().toISOString().split('T')[0]

    // Fetch leaves
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch balances
    const { data: balances } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('year', currentYear)

    // Stats for approvers
    let stats = { totalEmployees: 0, onLeaveToday: 0 }
    if (isApprover) {
      const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: onLeave } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)
      stats = { totalEmployees: total || 0, onLeaveToday: onLeave || 0 }
    }

    setData({
      leaves: leaves || [],
      balances: balances || [],
      stats
    })
    setLoading(false)
  }, [userId, isApprover])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCancelClick = (leave: Leave) => {
    setSelectedLeave(leave)
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedLeave) return
    setActionLoading(true)
    
    const result = await cancelLeave(selectedLeave.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Leave request cancelled')
      fetchData()
    }
    setActionLoading(false)
    setCancelDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your leave status</p>
      </div>

      {/* Approver Stats */}
      {isApprover && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Staff</p>
                  <p className="text-2xl font-bold text-blue-700">{data?.stats.totalEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Working Today</p>
                  <p className="text-2xl font-bold text-green-700">
                    {(data?.stats.totalEmployees || 0) - (data?.stats.onLeaveToday || 0)}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">On Leave</p>
                  <p className="text-2xl font-bold text-orange-700">{data?.stats.onLeaveToday}</p>
                </div>
                <CalendarOff className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Balances */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> My Leave Balance
        </h2>
        <div className="grid grid-cols-6 gap-3">
          {data?.balances.map((b) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                  {b.leave_type.replace(/_/g, ' ')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {Number(b.allocated) - Number(b.used)}
                  <span className="text-xs font-normal text-gray-400 ml-1">/{b.allocated}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leave History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Leave Requests</h2>
        <Card>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <LeaveTypeBadge type={leave.leave_type || 'casual'} />
                        {leave.is_half_day && (
                          <Badge variant="outline" className="text-[10px]">
                            {leave.half_day_period === 'morning' ? 'AM' : 'PM'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 max-w-[200px]">
                      <p className="truncate text-gray-600" title={leave.reason}>{leave.reason}</p>
                      {leave.status === 'rejected' && leave.rejection_reason && (
                        <p className="text-xs text-red-500 truncate" title={leave.rejection_reason}>
                          Reason: {leave.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {leave.is_half_day ? '0.5' : leave.days_count}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={leave.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {leave.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                            onClick={() => handleCancelClick(leave)}
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data?.leaves || data.leaves.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No leave requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Cancel Leave Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Leave Type:</span>
                <span className="text-sm font-medium capitalize">{selectedLeave?.leave_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Dates:</span>
                <span className="text-sm font-medium">
                  {selectedLeave && format(new Date(selectedLeave.start_date), 'MMM d, yyyy')} - {selectedLeave && format(new Date(selectedLeave.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days:</span>
                <span className="text-sm font-medium">
                  {selectedLeave?.is_half_day ? '0.5 (Half Day)' : selectedLeave?.days_count}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep Request</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={actionLoading}>
              {actionLoading ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
