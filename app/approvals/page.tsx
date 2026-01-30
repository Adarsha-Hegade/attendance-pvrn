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
import { format } from "date-fns"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoutButton } from "@/components/logout-button"

export default async function ApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'approver') {
        return <div className="p-10 text-red-500">Access Denied: Approvers only.</div>
    }

    const { data: leaves } = await supabase
        .from('leave_requests')
        .select('*, profiles(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Pending Approvals</h1>
                <div className="flex gap-2 items-center">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                    <LogoutButton />
                </div>
            </div>
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaves?.map((leave) => (
                    <TableRow key={leave.id}>
                        <TableCell>
                            <div className="font-medium">{leave.profiles && (leave.profiles as { full_name: string }).full_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{leave.profiles && (leave.profiles as { email: string }).email}</div>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{leave.reason}</TableCell>
                        <TableCell>
                            {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{format(new Date(leave.created_at), 'MMM d')}</TableCell>
                        <TableCell>
                            <ApprovalButtons id={leave.id} />
                        </TableCell>
                    </TableRow>
                    ))}
                    {!leaves?.length && <TableRow><TableCell colSpan={5} className="text-center">No pending requests</TableCell></TableRow>}
                </TableBody>
            </Table>
        </div>
    )
}
