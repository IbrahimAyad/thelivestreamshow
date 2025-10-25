import { useState, useEffect } from 'react'
import { User, LogIn, LogOut, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthProps {
  onAuthChange: (user: SupabaseUser | null, profile: UserProfile | null) => void
}

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  role: 'producer' | 'host' | 'guest'
  is_online: boolean
  last_active: string
}

export function Auth({ onAuthChange }: AuthProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Use centralized auth hook to prevent multiple GoTrueClient instances
  const { user, loading, signIn, signUp, signOut } = useAuth()

  // Load user profile when user changes
  useEffect(() => {
    if (user) {
      loadProfile(user.id)
    } else {
      setProfile(null)
      onAuthChange(null, null)
    }
  }, [user])

  useEffect(() => {
    // Update last_active every 30 seconds
    if (user && profile) {
      const interval = setInterval(() => {
        updateActivity()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user, profile])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          await createProfile(userId)
        } else {
          throw error
        }
      } else {
        const userProfile = data as unknown as UserProfile
        setProfile(userProfile)
        onAuthChange(user, userProfile)
        // Mark as online
        await supabase
          .from('user_profiles')
          .update({ is_online: true, last_active: new Date().toISOString() })
          .eq('id', userId)
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err)
    }
  }

  const createProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData.user?.email || ''

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: userEmail,
          display_name: displayName || userEmail.split('@')[0],
          role: 'guest', // Default role
          is_online: true
        })
        .select()
        .single()

      if (error) throw error
      
      const userProfile = data as unknown as UserProfile
      setProfile(userProfile)
      onAuthChange(user, userProfile)
    } catch (err: any) {
      console.error('Failed to create profile:', err)
    }
  }

  const updateActivity = async () => {
    if (!user) return
    try {
      await supabase
        .from('user_profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id)
    } catch (err) {
      console.error('Failed to update activity:', err)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        setShowLogin(false)
        setEmail('')
        setPassword('')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const result = await signUp(email, password, displayName)
      if (result.success) {
        setShowSignup(false)
        setEmail('')
        setPassword('')
        setDisplayName('')
        alert('Account created! Please check your email to verify your account.')
      } else {
        setError(result.error || 'Signup failed')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    try {
      // Mark as offline before signing out
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ is_online: false })
          .eq('id', user.id)
      }

      const result = await signOut()
      if (result.success) {
        setProfile(null)
      }
    } catch (err: any) {
      console.error('Logout error:', err)
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

  if (user && profile) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold">{profile.display_name || profile.email}</div>
          <div className="text-xs text-gray-400 flex items-center gap-2 justify-end">
            <span className={`px-2 py-0.5 rounded text-white ${getRoleBadgeColor(profile.role)}`}>
              {profile.role.toUpperCase()}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded flex items-center gap-2 text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowLogin(true)}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center gap-2 text-sm font-semibold"
      >
        <LogIn className="w-4 h-4" />
        Login
      </button>
      <button
        onClick={() => setShowSignup(true)}
        className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded flex items-center gap-2 text-sm font-semibold"
      >
        <UserPlus className="w-4 h-4" />
        Sign Up
      </button>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLogin(false)}>
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Login to Dashboard
            </h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-900/20 border border-red-900/50 rounded p-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-4 py-2 rounded font-semibold"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSignup(false)}>
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create Account
            </h3>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2"
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="bg-red-900/20 border border-red-900/50 rounded p-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-2 rounded font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignup(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
