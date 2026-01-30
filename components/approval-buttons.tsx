'use client'

import { approveLeave, rejectLeave } from "@/app/actions/leave"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ApprovalButtons({ id }: { id: string }) {
    const handleApprove = async () => {
        try {
            const res = await approveLeave(id)
            if (res?.error) toast.error(res.error)
            else toast.success("Leave approved")
        } catch (e) {
            toast.error("An error occurred")
        }
    }
    const handleReject = async () => {
         try {
            const res = await rejectLeave(id)
            if (res?.error) toast.error(res.error)
            else toast.info("Leave rejected")
         } catch(e) {
            toast.error("An error occurred")
         }
    }

    return (
        <div className="flex gap-2">
            <Button size="sm" onClick={handleApprove} className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
        </div>
    )
}
