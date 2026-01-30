import { LeaveForm } from "@/components/leave-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApplyLeavePage() {
  return (
    <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Apply for Leave</h1>
        <Card className="max-w-xl">
            <CardHeader>
                <CardTitle>New Leave Request</CardTitle>
            </CardHeader>
            <CardContent>
                <LeaveForm />
            </CardContent>
        </Card>
    </div>
  )
}
