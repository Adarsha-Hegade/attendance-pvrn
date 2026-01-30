import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: string }) {
  const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    pending: "secondary",
    approved: "default", // or green if customized
    rejected: "destructive",
  }
  
  // Custom styles for colors if badge variants aren't enough
  const styles: { [key: string]: string } = {
     approved: "bg-green-500 hover:bg-green-600",
     pending: "bg-yellow-500 hover:bg-yellow-600 text-white", // Yellow/Orange
     rejected: "bg-red-500 hover:bg-red-600",
  }

  return (
    <Badge className={styles[status] || ""}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
