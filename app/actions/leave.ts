'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { differenceInCalendarDays, parseISO } from 'date-fns'

export async function createLeave(formData: FormData) {
  const supabase = await createClient()
  
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const reason = formData.get('reason') as string
  const leave_type = formData.get('leave_type') as string
  const is_half_day = formData.get('is_half_day') === 'true'
  const half_day_period = formData.get('half_day_period') as string | null

  if (!start_date || !end_date || !reason || !leave_type) {
    return { error: 'All fields are required' }
  }

  // Calculate days
  const start = parseISO(start_date)
  const end = parseISO(end_date)
  let days_count = differenceInCalendarDays(end, start) + 1

  // Half day adjustment
  if (is_half_day) {
    days_count = 0.5
  }

  if (days_count <= 0) {
    return { error: 'End date must be after start date' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('leave_requests').insert({
    user_id: user.id,
    start_date,
    end_date,
    reason,
    leave_type,
    days_count,
    is_half_day,
    half_day_period: is_half_day ? half_day_period : null,
    status: 'pending'
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  redirect('/app')
}

export async function approveLeave(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  // 1. Get the leave request details first
  const { data: request, error: reqError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .single()
  
  if (reqError || !request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Request already processed' }

  // 2. Update status to approved
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({ status: 'approved' })
    .eq('id', id)
    .eq('status', 'pending')

  if (updateError) return { error: updateError.message }

  // 3. Update leave balance
  const currentYear = new Date().getFullYear()
  
  // Direct update of balance
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .match({ user_id: request.user_id, year: currentYear, leave_type: request.leave_type })
    .single()
    
  if (balance) {
    await supabase
      .from('leave_balances')
      .update({ used: Number(balance.used) + Number(request.days_count) })
      .eq('id', balance.id)
  }

  // 4. Log action
  await supabase.from('leave_actions').insert({
    leave_id: id,
    approver_id: user.id,
    action: 'approve'
  })

  revalidatePath('/app')
  return { success: true }
}

export async function rejectLeave(id: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('leave_requests')
    .update({ 
      status: 'rejected',
      rejection_reason: reason || null
    })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  await supabase.from('leave_actions').insert({
    leave_id: id,
    approver_id: user.id,
    action: 'reject'
  })

  revalidatePath('/app')
  return { success: true }
}

export async function cancelLeave(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  // Check if it's user's own leave and pending
  const { data: request, error: reqError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (reqError || !request) return { error: 'Request not found' }
  if (request.user_id !== user.id) return { error: 'Unauthorized' }
  if (request.status !== 'pending') return { error: 'Can only cancel pending requests' }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/app')
  return { success: true }
}

export async function updateLeave(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  // Check if it's user's own leave and pending
  const { data: request, error: reqError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (reqError || !request) return { error: 'Request not found' }
  if (request.user_id !== user.id) return { error: 'Unauthorized' }
  if (request.status !== 'pending') return { error: 'Can only edit pending requests' }

  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const reason = formData.get('reason') as string
  const leave_type = formData.get('leave_type') as string
  const is_half_day = formData.get('is_half_day') === 'true'
  const half_day_period = formData.get('half_day_period') as string | null

  // Calculate days
  const start = parseISO(start_date)
  const end = parseISO(end_date)
  let days_count = differenceInCalendarDays(end, start) + 1

  if (is_half_day) {
    days_count = 0.5
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({
      start_date,
      end_date,
      reason,
      leave_type,
      days_count,
      is_half_day,
      half_day_period: is_half_day ? half_day_period : null
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/app')
  return { success: true }
}

