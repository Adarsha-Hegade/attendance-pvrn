import { createClient } from '@/utils/supabase/server'
import { LeaveTable } from '@/components/leave-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CalendarCheck, UserCheck } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // 1. Fetch Leaves
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 2. Fetch Balances
  const currentYear = new Date().getFullYear()
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', currentYear)
  
  // 3. Admin / Approver Data
  const stats = {
      totalEmployees: 0,
      onLeaveToday: 0
  }
  
  if (profile?.role === 'approver') {
      const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      
      const today = new Date().toISOString().split('T')[0]
      const { count: onLeave } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)

     stats.totalEmployees = total || 0
     stats.onLeaveToday = onLeave || 0
  }

  return (
    <div className="container mx-auto py-10">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user.email}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
            <Button variant="outline" asChild>
                <Link href="/directory">Directory</Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/calendar">Calendar</Link>
            </Button>
            {profile?.role === 'approver' && (
                <>
                <Button variant="outline" asChild>
                    <Link href="/reports">Reports</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/approvals">Approvals</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/admin">Admin</Link>
                </Button>
                </>
            )}
            <Button asChild>
                <Link href="/apply-leave">Apply Leave</Link>
            </Button>
            <LogoutButton />
        </div>
      </div>

      {/* Approver Stats Widgets */}
      {profile?.role === 'approver' && (
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Working Today</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalEmployees - stats.onLeaveToday}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.onLeaveToday}</div>
                </CardContent>
            </Card>
          </div>
      )}

      {/* Employee Balances */}
      <h2 className="text-xl font-semibold mb-4">My Leave Balance ({currentYear})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {(balances || []).length > 0 ? balances?.map((b) => (
             <Card key={b.id}>
                <CardHeader className="p-3">
                    <CardTitle className="text-xs uppercase tracking-wider text-gray-500">{b.leave_type.replace(/_/g, ' ')}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-2xl font-bold">
                        {Number(b.allocated) - Number(b.used)} <span className="text-xs font-normal text-gray-400">/ {b.allocated}</span>
                    </div>
                </CardContent>
             </Card>  
          )) : (
              <div className="col-span-full text-gray-500 text-sm italic">
                  No balances found. Contact Admin to initialize.
              </div>
          )}
      </div>

      
      <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">My Leave History</h2>
          <LeaveTable leaves={leaves || []} />
      </div>
    </div>
  )
}
