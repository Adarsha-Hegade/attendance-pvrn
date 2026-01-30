import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  return (
    <AppShell 
      initialUser={{ 
        id: user.id, 
        email: user.email || '' 
      }}
      initialProfile={{ 
        role: profile?.role || 'employee', 
        full_name: profile?.full_name || undefined 
      }}
    />
  )
}
