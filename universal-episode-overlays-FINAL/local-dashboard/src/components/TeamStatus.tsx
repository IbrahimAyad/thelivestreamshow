import { useState, useEffect } from 'react'
import { Users, Circle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { UserProfile } from './Auth'

interface TeamStatusProps {
  currentUserId?: string
}

export function TeamStatus({ currentUserId }: TeamStatusProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([])

  useEffect(() => {
    loadOnlineUsers()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          loadOnlineUsers()
        }
      )
      .subscribe()

    // Refresh every 60 seconds
    const interval = setInterval(loadOnlineUsers, 60000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_online', true)
        .order('last_active', { ascending: false })

      if (error) throw error
      setOnlineUsers((data as unknown as UserProfile[]) || [])
    } catch (err) {
      console.error('Failed to load online users:', err)
    }
  }

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'producer': return 'bg-purple-600'
      case 'host': return 'bg-blue-600'
      case 'guest': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date().getTime()
    const then = new Date(timestamp).getTime()
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Team Online ({onlineUsers.length})
      </h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {onlineUsers.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            No team members online
          </div>
        )}
        {onlineUsers.map((user) => (
          <div
            key={user.id}
            className={`bg-[#1a1a1a] rounded p-2 flex items-center gap-2 ${
              user.id === currentUserId ? 'ring-2 ring-purple-600' : ''
            }`}
          >
            <Circle className="w-2 h-2 fill-green-400 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {user.display_name || user.email}
                {user.id === currentUserId && (
                  <span className="text-xs text-gray-400 ml-1">(You)</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {getTimeAgo(user.last_active)}
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded text-white ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
