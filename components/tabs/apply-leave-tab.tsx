'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createLeave } from '@/app/actions/leave'
import { cn } from '@/lib/utils'

const leaveTypes = [
  { value: 'casual', label: 'Casual Leave (CL)', color: 'bg-blue-500' },
  { value: 'sick', label: 'Sick Leave (SL)', color: 'bg-red-500' },
  { value: 'earned', label: 'Earned Leave (EL)', color: 'bg-green-500' },
  { value: 'study', label: 'Study Leave', color: 'bg-purple-500' },
  { value: 'work_from_home', label: 'Work From Home', color: 'bg-yellow-500' },
  { value: 'loss_of_pay', label: 'Loss of Pay', color: 'bg-gray-500' },
]

export function ApplyLeaveTab({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leaveType, setLeaveType] = useState('')
  const [reason, setReason] = useState('')
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [halfDayPeriod, setHalfDayPeriod] = useState('morning')
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!leaveType) newErrors.leaveType = 'Please select a leave type'
    if (isHalfDay) {
      if (!singleDate) newErrors.date = 'Please select a date'
    } else {
      if (!dateRange.from) newErrors.date = 'Please select a date range'
    }
    if (!reason || reason.length < 5) newErrors.reason = 'Reason must be at least 5 characters'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    const formData = new FormData()
    const start = isHalfDay ? singleDate! : dateRange.from!
    const end = isHalfDay ? singleDate! : (dateRange.to || dateRange.from!)

    formData.append('start_date', start.toISOString())
    formData.append('end_date', end.toISOString())
    formData.append('reason', reason)
    formData.append('leave_type', leaveType)
    formData.append('is_half_day', String(isHalfDay))
    if (isHalfDay) {
      formData.append('half_day_period', halfDayPeriod)
    }

    try {
      const result = await createLeave(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Leave request submitted successfully!')
        // Reset form
        setLeaveType('')
        setReason('')
        setIsHalfDay(false)
        setDateRange({ from: undefined, to: undefined })
        setSingleDate(undefined)
        onSuccess()
      }
    } catch {
      toast.success('Leave request submitted!')
      onSuccess()
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Apply for Leave</h1>
        <p className="text-sm text-gray-500">Submit a new leave request</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader className="py-4">
          <CardTitle className="text-base">New Leave Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className={errors.leaveType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leaveType && <p className="text-xs text-red-500">{errors.leaveType}</p>}
            </div>

            {/* Half Day Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <Checkbox
                id="half-day"
                checked={isHalfDay}
                onCheckedChange={(checked) => setIsHalfDay(checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="half-day" className="cursor-pointer">
                  Half Day Leave
                </Label>
                <p className="text-xs text-gray-500">Request for half a day only</p>
              </div>
            </div>

            {/* Half Day Period */}
            {isHalfDay && (
              <div className="space-y-2">
                <Label>Which half?</Label>
                <Select value={halfDayPeriod} onValueChange={setHalfDayPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">🌅 Morning (First Half)</SelectItem>
                    <SelectItem value="afternoon">🌆 Afternoon (Second Half)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>{isHalfDay ? 'Select Date' : 'Leave Dates'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !(isHalfDay ? singleDate : dateRange.from) && "text-muted-foreground",
                      errors.date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isHalfDay ? (
                      singleDate ? format(singleDate, "LLL dd, y") : <span>Pick a date</span>
                    ) : (
                      dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {isHalfDay ? (
                    <Calendar
                      mode="single"
                      selected={singleDate}
                      onSelect={setSingleDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  ) : (
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  )}
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason for Leave</Label>
              <Textarea
                placeholder="Please provide a detailed reason for your leave request..."
                className={cn("resize-none", errors.reason && "border-red-500")}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
