'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

export function DirectoryTab() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [onLeaveIds, setOnLeaveIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchData() {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      const { data: onLeaveData } = await supabase
        .from('leave_requests')
        .select('user_id')
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)

      setProfiles(profilesData || [])
      setOnLeaveIds(new Set(onLeaveData?.map(l => l.user_id) || []))
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-500">{profiles.length} employees</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {filtered.map((profile) => {
          const isOnLeave = onLeaveIds.has(profile.id)
          const initials = profile.full_name
            ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
            : profile.email?.[0]?.toUpperCase() || '?'

          return (
            <Card 
              key={profile.id} 
              className={`relative transition-all hover:shadow-md ${
                isOnLeave ? 'border-orange-200 bg-orange-50/50' : ''
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={isOnLeave ? 'bg-orange-200' : 'bg-blue-100 text-blue-600'}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{profile.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`inline-flex items-center text-xs ${isOnLeave ? 'text-orange-600' : 'text-green-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isOnLeave ? 'bg-orange-500' : 'bg-green-500'}`} />
                    {isOnLeave ? 'Away' : 'Working'}
                  </span>
                  <Badge variant={profile.role === 'approver' ? 'default' : 'secondary'} className="text-[10px]">
                    {profile.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
