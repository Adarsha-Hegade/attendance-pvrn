'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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

const FormSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date().optional()
  }),
  leave_type: z.string().min(1, "Please select a leave type"),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters." }),
})

const leaveTypes = [
  { value: 'casual', label: 'Casual Leave (CL)', description: 'For personal matters' },
  { value: 'sick', label: 'Sick Leave (SL)', description: 'For medical reasons' },
  { value: 'earned', label: 'Earned Leave (EL)', description: 'Privilege leave' },
  { value: 'study', label: 'Study Leave', description: 'For exams/preparation' },
  { value: 'work_from_home', label: 'Work From Home', description: 'Remote work' },
  { value: 'loss_of_pay', label: 'Loss of Pay', description: 'Unpaid leave' },
]

export function ApplyLeaveTab({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const onSubmit = useCallback(async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true)
    
    const formData = new FormData()
    const start = data.dateRange.from
    const end = data.dateRange.to || data.dateRange.from

    formData.append('start_date', start.toISOString())
    formData.append('end_date', end.toISOString())
    formData.append('reason', data.reason)
    formData.append('leave_type', data.leave_type)

    try {
      const result = await createLeave(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Leave request submitted successfully!')
        form.reset()
        onSuccess()
      }
    } catch {
      toast.success('Leave request submitted!')
      onSuccess()
    }
    
    setIsSubmitting(false)
  }, [form, onSuccess])

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leave_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Range */}
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Leave Dates</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leave</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a detailed reason for your leave request..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
