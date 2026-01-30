'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: 'employee' | 'approver') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  // Check if current user is an approver
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'approver') {
    return { error: 'Only approvers can change roles' }
  }

  // Update the target user's role
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  return { success: true }
}

export async function resetUserBalances(userId: string, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'approver') {
    return { error: 'Only approvers can reset balances' }
  }

  // Delete existing balances for that year
  await supabase.from('leave_balances').delete().match({ user_id: userId, year })

  // Re-initialize with default allocations
  const { error } = await supabase.rpc('initialize_balances', { target_user_id: userId, target_year: year })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function updateLeaveBalance(
  balanceId: string, 
  allocated: number, 
  used: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'approver') {
    return { error: 'Only approvers can update balances' }
  }

  const { error } = await supabase
    .from('leave_balances')
    .update({ allocated, used })
    .eq('id', balanceId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
