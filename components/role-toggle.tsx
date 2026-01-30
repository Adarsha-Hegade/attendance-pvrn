'use client'

import { updateUserRole } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export function RoleToggle({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    const newRole = role === 'employee' ? 'approver' : 'employee'
    setIsLoading(true)
    
    const result = await updateUserRole(userId, newRole)
    
    setIsLoading(false)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      setRole(newRole)
      toast.success(`Role changed to ${newRole}`)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant={role === 'employee' ? 'default' : 'outline'}
        size="sm"
        onClick={() => role !== 'employee' && handleToggle()}
        disabled={isLoading || role === 'employee'}
      >
        Employee
      </Button>
      <Button
        variant={role === 'approver' ? 'default' : 'outline'}
        size="sm"
        onClick={() => role !== 'approver' && handleToggle()}
        disabled={isLoading || role === 'approver'}
      >
        Approver
      </Button>
    </div>
  )
}
