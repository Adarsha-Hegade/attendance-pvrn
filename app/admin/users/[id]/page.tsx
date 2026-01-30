import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { RoleToggle } from '@/components/role-toggle'
import { BalanceEditor } from '@/components/balance-editor'
import { ArrowLeft } from 'lucide-react'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (currentProfile?.role !== 'approver') {
    redirect('/dashboard')
  }

  // Fetch target user profile
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!targetProfile) {
    return <div className="container mx-auto py-10 text-center text-red-500">User not found</div>
  }

  // Fetch balances
  const currentYear = new Date().getFullYear()
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', id)
    .eq('year', currentYear)
    .order('leave_type')

  // Fetch leave stats
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const totalApproved = leaves?.filter(l => l.status === 'approved').length || 0
  const totalPending = leaves?.filter(l => l.status === 'pending').length || 0

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{targetProfile.full_name || 'User Details'}</h1>
            <p className="text-gray-500">{targetProfile.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/reports?employee=${id}`}>View Reports</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{targetProfile.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{targetProfile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium">{format(new Date(targetProfile.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Role</p>
                <Badge variant={targetProfile.role === 'approver' ? 'default' : 'secondary'} className="mt-1">
                  {targetProfile.role}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Change Role</p>
              <RoleToggle userId={id} currentRole={targetProfile.role} />
            </div>
          </CardContent>
        </Card>

        {/* Leave Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Statistics</CardTitle>
            <CardDescription>Quick overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalApproved}</div>
                <div className="text-sm text-gray-500">Approved Leaves</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balances */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Leave Balances ({currentYear})</CardTitle>
          <CardDescription>Click to edit allocation</CardDescription>
        </CardHeader>
        <CardContent>
          {balances && balances.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {balances.map((balance) => (
                <BalanceEditor key={balance.id} balance={balance} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No balances found. Balances may need initialization.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Leaves */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaves?.map((leave) => (
              <div key={leave.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <span className="text-sm font-medium">{leave.reason || 'No reason'}</span>
                  <div className="text-xs text-gray-500">
                    {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <Badge variant={
                  leave.status === 'approved' ? 'default' :
                  leave.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {leave.status}
                </Badge>
              </div>
            ))}
            {(!leaves || leaves.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No leave requests found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
