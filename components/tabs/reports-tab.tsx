'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeaveTypeBadge } from '@/components/leave-type-badge'
import { StatusBadge } from '@/components/status-badge'
import { format } from 'date-fns'
import { FileText } from 'lucide-react'

interface Leave {
  id: string
  leave_type: string
  reason: string
  start_date: string
  end_date: string
  days_count: number
  status: string
  created_at: string
}

interface Balance {
  id: string
  leave_type: string
  allocated: number
  used: number
}

interface Profile {
  id: string
  full_name: string
  email: string
}

export function ReportsTab({ userId, isApprover }: { userId: string; isApprover: boolean }) {
  const [employees, setEmployees] = useState<Profile[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState(userId)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  useEffect(() => {
    async function fetchEmployees() {
      if (isApprover) {
        const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
        setEmployees(data || [])
      }
    }
    fetchEmployees()
  }, [isApprover, supabase])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const yearStart = `${selectedYear}-01-01`
      const yearEnd = `${selectedYear}-12-31`

      const { data: leavesData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', selectedEmployee)
        .gte('start_date', yearStart)
        .lte('start_date', yearEnd)
        .order('start_date', { ascending: false })

      const { data: balancesData } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', selectedEmployee)
        .eq('year', selectedYear)

      setLeaves(leavesData || [])
      setBalances(balancesData || [])
      setLoading(false)
    }
    fetchData()
  }, [selectedEmployee, selectedYear, supabase])

  // Summary calculation
  const summary: Record<string, { total: number; approved: number; pending: number; rejected: number }> = {}
  leaves.forEach((leave) => {
    const type = leave.leave_type || 'casual'
    if (!summary[type]) summary[type] = { total: 0, approved: 0, pending: 0, rejected: 0 }
    summary[type].total += Number(leave.days_count || 0)
    if (leave.status === 'approved') summary[type].approved += Number(leave.days_count || 0)
    if (leave.status === 'pending') summary[type].pending += Number(leave.days_count || 0)
    if (leave.status === 'rejected') summary[type].rejected += Number(leave.days_count || 0)
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leave Reports</h1>
          <p className="text-sm text-gray-500">Detailed leave history and analytics</p>
        </div>
        <div className="flex gap-3">
          {isApprover && (
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name || emp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Balances */}
          <div className="grid grid-cols-6 gap-3">
            {balances.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{b.leave_type.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-bold">
                    {Number(b.allocated) - Number(b.used)}
                    <span className="text-xs font-normal text-gray-400 ml-1">/{b.allocated}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-6 gap-3">
            {Object.entries(summary).map(([type, data]) => (
              <Card key={type}>
                <CardContent className="p-3">
                  <LeaveTypeBadge type={type} />
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total:</span>
                      <span className="font-medium">{data.total}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Approved:</span>
                      <span>{data.approved}</span>
                    </div>
                    <div className="flex justify-between text-yellow-600">
                      <span>Pending:</span>
                      <span>{data.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* History Table */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Leave History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2"><LeaveTypeBadge type={leave.leave_type || 'casual'} /></td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{leave.reason}</td>
                      <td className="px-4 py-2">
                        {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                      </td>
                      <td className="px-4 py-2">{leave.days_count}</td>
                      <td className="px-4 py-2"><StatusBadge status={leave.status} /></td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No leaves found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
