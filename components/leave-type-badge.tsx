import { Badge } from "@/components/ui/badge"

export function LeaveTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
      casual: 'CL',
      sick: 'SL',
      earned: 'EL',
      study: 'Study',
      work_from_home: 'WFH',
      loss_of_pay: 'LOP'
  }
  return (
    <Badge variant="outline" className="uppercase text-xs tracking-wide">
        {labels[type] || type}
    </Badge>
  )
}
