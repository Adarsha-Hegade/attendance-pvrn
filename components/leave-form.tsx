"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createLeave } from "@/app/actions/leave"
import { cn } from "@/lib/utils"

const FormSchema = z.object({
  dateRange: z.object({
      from: z.date(),
      to: z.date().optional()
  }),
  leave_type: z.string().min(1, "Please select a leave type"),
  reason: z.string().min(5, {
    message: "Reason must be at least 5 characters.",
  }),
})

export function LeaveForm() {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        const formData = new FormData()
        const start = data.dateRange.from
        const end = data.dateRange.to || data.dateRange.from
        
        formData.append('start_date', start.toISOString())
        formData.append('end_date', end.toISOString())
        formData.append('reason', data.reason)
        formData.append('leave_type', data.leave_type)

        const result = await createLeave(formData)
        
        if (result?.error) {
             toast.error(result.error)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
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
                                <SelectItem value="casual">Casual Leave (CL)</SelectItem>
                                <SelectItem value="sick">Sick Leave (SL)</SelectItem>
                                <SelectItem value="earned">Earned Leave (EL)</SelectItem>
                                <SelectItem value="study">Study Leave</SelectItem>
                                <SelectItem value="work_from_home">Work From Home</SelectItem>
                                <SelectItem value="loss_of_pay">Loss of Pay</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

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
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                    <>
                                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                                        {format(field.value.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(field.value.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date(new Date().setHours(0, 0, 0, 0))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Why are you taking leave?" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit Request</Button>
            </form>
        </Form>
    )
}
