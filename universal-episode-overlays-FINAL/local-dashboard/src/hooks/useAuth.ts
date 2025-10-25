import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { logger } from '../lib/logger'

interface AuthState {
  user: SupabaseUser | null
  loading: boolean
  error: string | null
}

/**
 * Custom hook for managing Supabase authentication state
 * Prevents multiple auth state listeners and provides consistent auth handling
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })
  
  const authListenerRef = useRef<any>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) {
      return
    }
    
    initializedRef.current = true
    logger.debug('Initializing auth state listener')

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('Session check error:', error)
          setAuthState(prev => ({
            ...prev,
            error: error.message,
            loading: false
          }))
          return
        }

        logger.debug('Current session:', session ? 'Active' : 'None')
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
          error: null
        }))
      } catch (err: any) {
        logger.error('Session check failed:', err)
        setAuthState(prev => ({
          ...prev,
          error: err.message,
          loading: false
        }))
      }
    }

    checkSession()

    // Set up auth state listener only once
    if (!authListenerRef.current) {
      logger.debug('Setting up auth state listener')
      
      authListenerRef.current = supabase.auth.onAuthStateChange(
        (event, session) => {
          logger.debug('Auth state changed:', event, session?.user?.email || 'no user')
          
          setAuthState(prev => ({
            ...prev,
            user: session?.user ?? null,
            loading: false,
            error: null
          }))

          // Handle specific events
          switch (event) {
            case 'SIGNED_IN':
              logger.info('User signed in:', session?.user?.email)
              break
            case 'SIGNED_OUT':
              logger.info('User signed out')
              break
            case 'TOKEN_REFRESHED':
              logger.debug('Token refreshed')
              break
            default:
              logger.debug('Auth event:', event)
          }
        }
      )

      logger.debug('Auth state listener established')
    }

    // Cleanup function
    return () => {
      logger.debug('Cleaning up auth state listener')
      
      if (authListenerRef.current?.subscription) {
        authListenerRef.current.subscription.unsubscribe()
        authListenerRef.current = null
      }
      
      initializedRef.current = false
    }
  }, [])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn: async (email: string, password: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        
        logger.conversation('Sign in successful:', data.user?.email)
        return { success: true, user: data.user }
      } catch (err: any) {
        logger.error('Sign in failed:', err)
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: err.message
        }))
        return { success: false, error: err.message }
      }
    },
    signUp: async (email: string, password: string, displayName?: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0]
            }
          }
        })

        if (error) throw error
        
        logger.conversation('Sign up successful:', data.user?.email)
        return { success: true, user: data.user }
      } catch (err: any) {
        logger.error('Sign up failed:', err)
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: err.message
        }))
        return { success: false, error: err.message }
      }
    },
    signOut: async () => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        logger.conversation('Sign out successful')
        setAuthState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: null
        }))
        return { success: true }
      } catch (err: any) {
        logger.error('Sign out failed:', err)
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: err.message
        }))
        return { success: false, error: err.message }
      }
    },
    resetPassword: async (email: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        
        logger.info('Password reset email sent to:', email)
        return { success: true }
      } catch (err: any) {
        logger.error('Password reset failed:', err)
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: err.message
        }))
        return { success: false, error: err.message }
      }
    }
  }
}