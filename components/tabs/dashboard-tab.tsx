'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, CalendarOff, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/status-badge'
import { LeaveTypeBadge } from '@/components/leave-type-badge'

interface DashboardData {
  leaves: Array<{
    id: string
    leave_type: string
    reason: string
    start_date: string
    end_date: string
    days_count: number
    status: string
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

export function DashboardTab({ 
  userId, 
  isApprover
}: { 
  userId: string
  isApprover: boolean
}) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchData() {
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
    }

    fetchData()
  }, [userId, isApprover])

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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2">
                      <LeaveTypeBadge type={leave.leave_type || 'casual'} />
                    </td>
                    <td className="px-4 py-2 max-w-[200px] truncate text-gray-600">{leave.reason}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{leave.days_count}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={leave.status} />
                    </td>
                  </tr>
                ))}
                {(!data?.leaves || data.leaves.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No leave requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
