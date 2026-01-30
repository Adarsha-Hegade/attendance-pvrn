import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default async function DirectoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  // Fetch who's on leave today
  const today = new Date().toISOString().split('T')[0]
  const { data: onLeaveToday } = await supabase
    .from('leave_requests')
    .select('user_id')
    .eq('status', 'approved')
    .lte('start_date', today)
    .gte('end_date', today)

  const onLeaveIds = new Set(onLeaveToday?.map(l => l.user_id) || [])

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employee Directory</h1>
          <p className="text-gray-500">{profiles?.length || 0} employees</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {profiles?.map((profile) => {
          const isOnLeave = onLeaveIds.has(profile.id)
          const initials = profile.full_name
            ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : profile.email?.[0]?.toUpperCase() || '?'

          return (
            <Card key={profile.id} className={`relative overflow-hidden ${isOnLeave ? 'border-orange-300 bg-orange-50' : ''}`}>
              {isOnLeave && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-bl">
                  On Leave
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={isOnLeave ? 'bg-orange-200' : 'bg-blue-100'}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{profile.full_name || 'Unnamed'}</p>
                    <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                    <Badge variant={profile.role === 'approver' ? 'default' : 'secondary'} className="mt-1 text-xs">
                      {profile.role}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className={`inline-flex items-center text-xs ${isOnLeave ? 'text-orange-600' : 'text-green-600'}`}>
                    <span className={`w-2 h-2 rounded-full mr-1 ${isOnLeave ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                    {isOnLeave ? 'Away' : 'Working'}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/reports?employee=${profile.id}`}>View Leaves</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(!profiles || profiles.length === 0) && (
        <div className="text-center py-10 text-gray-500">
          No employees found.
        </div>
      )}
    </div>
  )
}
