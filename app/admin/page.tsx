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
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Users, Settings, Shield } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'approver') {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center text-red-500">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p>Only approvers can access the admin panel.</p>
        </div>
      </div>
    )
  }

  // Fetch all users
  const { data: allProfiles, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Count by role
  const approverCount = allProfiles?.filter(p => p.role === 'approver').length || 0
  const employeeCount = allProfiles?.filter(p => p.role === 'employee').length || 0

  // Recent leaves
  const { data: recentLeaves } = await supabase
    .from('leave_requests')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-500">Manage users, roles, and system settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approvers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{approverCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{employeeCount}</div>
          </CardContent>
        </Card>

        <Link href="/admin/users" className="block">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Users</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Change roles, view details →</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* User List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Click on a user to manage their role</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProfiles?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || 'No name'}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    <Badge variant={p.role === 'approver' ? 'default' : 'secondary'}>
                      {p.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(p.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/users/${p.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLeaves?.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{(leave.profiles as { full_name: string })?.full_name || 'Unknown'}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                  </span>
                </div>
                <Badge variant={
                  leave.status === 'approved' ? 'default' :
                  leave.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {leave.status}
                </Badge>
              </div>
            ))}
            {(!recentLeaves || recentLeaves.length === 0) && (
              <p className="text-gray-500 text-sm">No recent leave requests.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
