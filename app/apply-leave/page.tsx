import { LeaveForm } from "@/components/leave-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ApplyLeavePage() {
  return (
    <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Apply for Leave</h1>
        </div>
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
