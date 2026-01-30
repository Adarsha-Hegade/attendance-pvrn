'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { Users, Shield, Settings, Pencil } from 'lucide-react'
import { updateUserRole, updateLeaveBalance } from '@/app/actions/admin'
import { toast } from 'sonner'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface Balance {
  id: string
  leave_type: string
  allocated: number
  used: number
}

export function AdminTab() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [userBalances, setUserBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false)
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null)
  const [editAllocated, setEditAllocated] = useState(0)
  const [editUsed, setEditUsed] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })
      setProfiles(data || [])
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const handleUserClick = async (user: Profile) => {
    setSelectedUser(user)
    const currentYear = new Date().getFullYear()
    const { data } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .order('leave_type')
    setUserBalances(data || [])
    setDialogOpen(true)
  }

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser) return
    const result = await updateUserRole(selectedUser.id, newRole as 'employee' | 'approver')
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Role updated')
      setSelectedUser({ ...selectedUser, role: newRole })
      setProfiles(profiles.map(p => p.id === selectedUser.id ? { ...p, role: newRole } : p))
    }
  }

  const handleBalanceEdit = (balance: Balance) => {
    setSelectedBalance(balance)
    setEditAllocated(balance.allocated)
    setEditUsed(balance.used)
    setBalanceDialogOpen(true)
  }

  const handleBalanceSave = async () => {
    if (!selectedBalance) return
    const result = await updateLeaveBalance(selectedBalance.id, editAllocated, editUsed)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Balance updated')
      setUserBalances(userBalances.map(b => 
        b.id === selectedBalance.id ? { ...b, allocated: editAllocated, used: editUsed } : b
      ))
    }
    setBalanceDialogOpen(false)
  }

  const approverCount = profiles.filter(p => p.role === 'approver').length
  const employeeCount = profiles.filter(p => p.role === 'employee').length

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
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500">Manage users and system settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase">Total Users</p>
                <p className="text-2xl font-bold text-blue-700">{profiles.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase">Approvers</p>
                <p className="text-2xl font-bold text-purple-700">{approverCount}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase">Employees</p>
                <p className="text-2xl font-bold text-green-700">{employeeCount}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" /> User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{profile.full_name || 'No name'}</td>
                  <td className="px-4 py-2 text-gray-600">{profile.email}</td>
                  <td className="px-4 py-2">
                    <Badge variant={profile.role === 'approver' ? 'default' : 'secondary'}>
                      {profile.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{format(new Date(profile.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => handleUserClick(profile)}>
                      <Pencil className="h-3 w-3 mr-1" /> Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* User Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedUser.full_name || 'No name'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Role</p>
                <Select value={selectedUser.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="approver">Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Leave Balances ({new Date().getFullYear()})</p>
                <div className="grid grid-cols-3 gap-2">
                  {userBalances.map((b) => (
                    <div 
                      key={b.id} 
                      className="p-2 border rounded cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => handleBalanceEdit(b)}
                    >
                      <p className="text-[10px] uppercase text-gray-500">{b.leave_type.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-bold">
                        {Number(b.allocated) - Number(b.used)}
                        <span className="text-xs font-normal text-gray-400">/{b.allocated}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Edit Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedBalance?.leave_type.replace(/_/g, ' ').toUpperCase()} Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Allocated Days</label>
              <Input
                type="number"
                min={0}
                value={editAllocated}
                onChange={(e) => setEditAllocated(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Used Days</label>
              <Input
                type="number"
                min={0}
                value={editUsed}
                onChange={(e) => setEditUsed(Number(e.target.value))}
              />
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-bold">{editAllocated - editUsed} days</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleBalanceSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
