import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from 'date-fns'
import { StatusBadge } from '@/components/status-badge'
import { LeaveTypeBadge } from '@/components/leave-type-badge'
import { FileText } from 'lucide-react'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string; year?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user's role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  const selectedEmployeeId = params.employee || user.id
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()

  // Fetch all employees (for approvers) or just self
  let employees: Array<{ id: string; full_name: string; email: string }> = []
  if (profile?.role === 'approver') {
    const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    employees = data || []
  } else {
    employees = [{ id: user.id, full_name: 'Me', email: user.email || '' }]
  }

  // Fetch selected employee's profile
  const { data: selectedProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', selectedEmployeeId)
    .single()

  // Fetch leaves for selected employee and year
  const yearStart = `${selectedYear}-01-01`
  const yearEnd = `${selectedYear}-12-31`
  
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', selectedEmployeeId)
    .gte('start_date', yearStart)
    .lte('start_date', yearEnd)
    .order('start_date', { ascending: false })

  // Fetch balances
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', selectedEmployeeId)
    .eq('year', selectedYear)

  // Calculate summary
  const summary: Record<string, { total: number; approved: number; pending: number; rejected: number }> = {}
  
  leaves?.forEach((leave) => {
    const type = leave.leave_type || 'casual'
    if (!summary[type]) {
      summary[type] = { total: 0, approved: 0, pending: 0, rejected: 0 }
    }
    summary[type].total += Number(leave.days_count || 0)
    if (leave.status === 'approved') summary[type].approved += Number(leave.days_count || 0)
    if (leave.status === 'pending') summary[type].pending += Number(leave.days_count || 0)
    if (leave.status === 'rejected') summary[type].rejected += Number(leave.days_count || 0)
  })

  // Available years
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leave Reports</h1>
          <p className="text-gray-500">Detailed leave history and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/calendar">Calendar</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {profile?.role === 'approver' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Employee</label>
                <form>
                  <Select name="employee" defaultValue={selectedEmployeeId}>
                    <SelectTrigger className="w-[250px]">
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
                </form>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Year</label>
              <form>
                <Select name="year" defaultValue={selectedYear.toString()}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </form>
            </div>

            <Button asChild>
              <Link href={`/reports?employee=${selectedEmployeeId}&year=${selectedYear}`}>
                Apply Filter
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{selectedProfile?.full_name || 'Employee'}</CardTitle>
          <CardDescription>{selectedProfile?.email}</CardDescription>
        </CardHeader>
      </Card>

      {/* Balance Summary */}
      <h2 className="text-lg font-semibold mb-3">Leave Balance ({selectedYear})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(balances || []).map((b) => (
          <Card key={b.id}>
            <CardContent className="p-3">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                {b.leave_type.replace(/_/g, ' ')}
              </div>
              <div className="text-xl font-bold">
                {Number(b.allocated) - Number(b.used)}
                <span className="text-sm font-normal text-gray-400"> / {b.allocated}</span>
              </div>
              <div className="text-xs text-gray-400">Used: {b.used}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary by Type */}
      <h2 className="text-lg font-semibold mb-3">Summary by Leave Type</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(summary).map(([type, data]) => (
          <Card key={type}>
            <CardContent className="p-3">
              <LeaveTypeBadge type={type} />
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Days:</span>
                  <span className="font-medium">{data.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Approved:</span>
                  <span>{data.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Pending:</span>
                  <span>{data.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Rejected:</span>
                  <span>{data.rejected}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {Object.keys(summary).length === 0 && (
          <div className="col-span-full text-gray-500 text-sm">No leave requests for this period.</div>
        )}
      </div>

      {/* Detailed History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Leave History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves?.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell><LeaveTypeBadge type={leave.leave_type || 'casual'} /></TableCell>
                  <TableCell className="max-w-[200px] truncate" title={leave.reason}>{leave.reason}</TableCell>
                  <TableCell>{format(new Date(leave.start_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(leave.end_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{leave.days_count}</TableCell>
                  <TableCell><StatusBadge status={leave.status} /></TableCell>
                  <TableCell>{format(new Date(leave.created_at), 'MMM d')}</TableCell>
                </TableRow>
              ))}
              {(!leaves || leaves.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No leave requests found for {selectedYear}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
