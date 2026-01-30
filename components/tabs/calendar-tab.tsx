'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO, isWithinInterval, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const leaveColors: Record<string, string> = {
  casual: 'bg-blue-100 text-blue-700',
  sick: 'bg-red-100 text-red-700',
  earned: 'bg-green-100 text-green-700',
  study: 'bg-purple-100 text-purple-700',
  work_from_home: 'bg-yellow-100 text-yellow-700',
  loss_of_pay: 'bg-gray-100 text-gray-700',
}

interface Leave {
  id: string
  start_date: string
  end_date: string
  leave_type: string
  profiles: { full_name: string }
}

export function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [leaves, setLeaves] = useState<Leave[]>([])

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd])

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchLeaves() {
      const { data } = await supabase
        .from('leave_requests')
        .select('*, profiles(full_name)')
        .eq('status', 'approved')
        .lte('start_date', monthEnd.toISOString())
        .gte('end_date', monthStart.toISOString())
      
      setLeaves(data || [])
    }
    fetchLeaves()
  }, [currentDate, monthEnd, monthStart])

  const getLeavesByDay = (day: Date) => {
    return leaves.filter(leave => {
      const start = parseISO(leave.start_date)
      const end = parseISO(leave.end_date)
      return isWithinInterval(day, { start, end })
    })
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Calendar</h1>
          <p className="text-sm text-gray-500">View all approved leaves</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(leaveColors).map(([type, color]) => (
          <Badge key={type} variant="outline" className={color}>
            {type.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-r border-b bg-gray-50" />
            ))}

            {days.map((day) => {
              const dayLeaves = getLeavesByDay(day)
              const isWeekend = day.getDay() === 0 || day.getDay() === 6

              return (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className={`min-h-[80px] border-r border-b p-1 ${
                    isToday(day) ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayLeaves.slice(0, 2).map((leave) => (
                      <div
                        key={leave.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate ${leaveColors[leave.leave_type] || 'bg-gray-100'}`}
                      >
                        {leave.profiles?.full_name?.split(' ')[0]}
                      </div>
                    ))}
                    {dayLeaves.length > 2 && (
                      <div className="text-[10px] text-gray-500 px-1">+{dayLeaves.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
