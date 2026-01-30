import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isWithinInterval } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Helper to get leave type colors
const leaveColors: Record<string, string> = {
  casual: 'bg-blue-100 text-blue-800 border-blue-200',
  sick: 'bg-red-100 text-red-800 border-red-200',
  earned: 'bg-green-100 text-green-800 border-green-200',
  study: 'bg-purple-100 text-purple-800 border-purple-200',
  work_from_home: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  loss_of_pay: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Current month/year from params or default to now
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth()

  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(new Date(year, month))
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Fetch all approved leaves for this month range
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*, profiles(full_name, email)')
    .eq('status', 'approved')
    .lte('start_date', monthEnd.toISOString())
    .gte('end_date', monthStart.toISOString())

  // Map leaves to days
  const leavesByDay: Record<string, Array<{ name: string; type: string; id: string }>> = {}
  
  leaves?.forEach((leave) => {
    const start = parseISO(leave.start_date)
    const end = parseISO(leave.end_date)
    
    days.forEach((day) => {
      if (isWithinInterval(day, { start, end })) {
        const key = format(day, 'yyyy-MM-dd')
        if (!leavesByDay[key]) leavesByDay[key] = []
        leavesByDay[key].push({
          name: (leave.profiles as { full_name: string })?.full_name || 'Unknown',
          type: leave.leave_type || 'casual',
          id: leave.id
        })
      }
    })
  })

  // Navigation
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Calendar</h1>
          <p className="text-gray-500">View all approved leaves</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/directory">Directory</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" asChild>
          <Link href={`/calendar?month=${prevMonth}&year=${prevYear}`}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Link>
        </Button>

        <h2 className="text-xl font-semibold">
          {format(new Date(year, month), 'MMMM yyyy')}
        </h2>

        <Button variant="outline" asChild>
          <Link href={`/calendar?month=${nextMonth}&year=${nextYear}`}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center font-medium text-gray-500 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b bg-gray-50"></div>
            ))}

            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayLeaves = leavesByDay[key] || []
              const isWeekend = day.getDay() === 0 || day.getDay() === 6

              return (
                <div
                  key={key}
                  className={`min-h-[100px] border-r border-b p-1 ${
                    isToday(day) ? 'bg-blue-50 border-blue-200' : isWeekend ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayLeaves.slice(0, 3).map((leave, idx) => (
                      <div
                        key={`${leave.id}-${idx}`}
                        className={`text-xs px-1 py-0.5 rounded truncate ${leaveColors[leave.type] || 'bg-gray-100'}`}
                        title={`${leave.name} - ${leave.type}`}
                      >
                        {leave.name.split(' ')[0]}
                      </div>
                    ))}
                    {dayLeaves.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">+{dayLeaves.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(leaveColors).map(([type, color]) => (
          <div key={type} className={`px-2 py-1 rounded text-xs border ${color}`}>
            {type.replace(/_/g, ' ').toUpperCase()}
          </div>
        ))}
      </div>

      {/* Today's Leaves */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">On Leave Today</CardTitle>
        </CardHeader>
        <CardContent>
          {leavesByDay[format(now, 'yyyy-MM-dd')]?.length ? (
            <div className="flex flex-wrap gap-2">
              {leavesByDay[format(now, 'yyyy-MM-dd')]?.map((leave, idx) => (
                <Badge key={idx} variant="outline" className={leaveColors[leave.type]}>
                  {leave.name} ({leave.type.toUpperCase()})
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Everyone is working today! 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
