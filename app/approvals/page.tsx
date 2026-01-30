import { createClient } from '@/utils/supabase/server'
import { ApprovalButtons } from '@/components/approval-buttons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoutButton } from "@/components/logout-button"
import { LeaveTypeBadge } from "@/components/leave-type-badge"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'

export default async function ApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'approver') {
        return (
            <div className="container mx-auto py-10 text-center">
                <div className="text-red-500 text-lg font-semibold">Access Denied</div>
                <p className="text-gray-500">Only approvers can access this page.</p>
                <Button className="mt-4" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        )
    }

    // Fetch pending leaves
    const { data: pendingLeaves, count: pendingCount } = await supabase
        .from('leave_requests')
        .select('*, profiles(full_name, email)', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    // Fetch recent approved/rejected (last 10)
    const { data: recentActions } = await supabase
        .from('leave_requests')
        .select('*, profiles(full_name)')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(10)

    // Stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { count: todayCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())

    return (
        <div className="container mx-auto py-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Approvals</h1>
                    <p className="text-gray-500">Review and process leave requests</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/calendar">Calendar</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin">Admin</Link>
                    </Button>
                    <LogoutButton />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">{pendingCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Awaiting your action</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Requests</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{todayCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Submitted today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Requests Table */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        Pending Approvals
                    </CardTitle>
                    <CardDescription>
                        {pendingCount === 0 ? 'All caught up!' : `${pendingCount} request(s) need your attention`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Applied</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingLeaves?.map((leave) => (
                                <TableRow key={leave.id} className="hover:bg-yellow-50">
                                    <TableCell>
                                        <div className="font-medium">{(leave.profiles as { full_name: string })?.full_name || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500">{(leave.profiles as { email: string })?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <LeaveTypeBadge type={leave.leave_type || 'casual'} />
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <span className="truncate block" title={leave.reason}>{leave.reason}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{leave.days_count || 1}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {format(new Date(leave.created_at), 'MMM d, h:mm a')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ApprovalButtons id={leave.id} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!pendingLeaves || pendingLeaves.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                        All caught up!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Decisions</CardTitle>
                    <CardDescription>Last 10 approved/rejected requests</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {recentActions?.map((leave) => (
                            <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    {leave.status === 'approved' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <div>
                                        <span className="font-medium">{(leave.profiles as { full_name: string })?.full_name}</span>
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
                        {(!recentActions || recentActions.length === 0) && (
                            <p className="text-center text-gray-500 py-4">No recent activity.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
