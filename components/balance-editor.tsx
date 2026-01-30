'use client'

import { updateLeaveBalance } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useState } from 'react'
import { Pencil } from 'lucide-react'

interface Balance {
  id: string
  leave_type: string
  allocated: number
  used: number
}

export function BalanceEditor({ balance }: { balance: Balance }) {
  const [allocated, setAllocated] = useState(balance.allocated)
  const [used, setUsed] = useState(balance.used)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    const result = await updateLeaveBalance(balance.id, Number(allocated), Number(used))
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Balance updated')
    }
  }

  const remaining = Number(allocated) - Number(used)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                {balance.leave_type.replace(/_/g, ' ')}
              </div>
              <Pencil className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-xl font-bold mt-1">
              {remaining}
              <span className="text-sm font-normal text-gray-400"> / {balance.allocated}</span>
            </div>
            <div className="text-xs text-gray-400">Used: {balance.used}</div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {balance.leave_type.replace(/_/g, ' ').toUpperCase()} Balance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Allocated Days</label>
            <Input
              type="number"
              min={0}
              value={allocated}
              onChange={(e) => setAllocated(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Used Days</label>
            <Input
              type="number"
              min={0}
              max={allocated}
              value={used}
              onChange={(e) => setUsed(Number(e.target.value))}
            />
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Remaining</div>
            <div className="text-2xl font-bold">{Number(allocated) - Number(used)} days</div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
