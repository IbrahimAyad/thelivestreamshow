import { supabase } from '../supabase'

/**
 * Show Profile Interface
 * Represents a complete show with its own configuration and settings
 */
export interface ShowProfile {
  id: string
  created_at: string
  updated_at: string

  // Identity
  name: string
  description: string
  slug: string // URL-friendly identifier

  // Branding
  primary_color?: string
  secondary_color?: string
  logo_url?: string
  cover_image_url?: string

  // Schedule
  schedule_type?: 'daily' | 'weekly' | 'monthly' | 'custom'
  schedule_day?: number // Day of week (0-6) or day of month (1-31)
  schedule_time?: string // HH:MM format
  timezone?: string

  // Configuration
  default_automation_config?: Record<string, any>
  default_obs_scene?: string

  // Metadata
  is_active: boolean
  is_archived: boolean
  is_template: boolean
  episode_count: number
  last_aired_at?: string
  next_scheduled_at?: string

  // Ownership
  created_by?: string
  team_id?: string

  // Statistics
  total_episodes: number
  total_watch_time?: number
  avg_viewer_count?: number
}

export interface ShowFilter {
  search?: string
  is_active?: boolean
  is_archived?: boolean
  is_template?: boolean
  created_by?: string
  team_id?: string
}

export interface ShowTemplate {
  name: string
  description: string
  primary_color: string
  secondary_color: string
  default_automation_config: Record<string, any>
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom'
}

/**
 * ShowManager
 * Service for managing show profiles and switching between shows
 */
export class ShowManager {
  private shows: ShowProfile[] = []
  private activeShowId: string | null = null
  private listeners: Set<(shows: ShowProfile[]) => void> = new Set()
  private activeShowListeners: Set<(show: ShowProfile | null) => void> = new Set()
  private subscription: any = null

  constructor() {
    this.initializeSubscription()
    this.loadActiveShow()
  }

  /**
   * Initialize real-time subscription for show updates
   */
  private initializeSubscription() {
    this.subscription = supabase
      .channel('shows-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shows'
        },
        (payload) => {
          console.log('Shows changed:', payload)
          this.loadShows()
        }
      )
      .subscribe()
  }

  /**
   * Load active show from localStorage
   */
  private async loadActiveShow() {
    const storedShowId = localStorage.getItem('activeShowId')
    if (storedShowId) {
      this.activeShowId = storedShowId
      const show = await this.getShowById(storedShowId)
      this.notifyActiveShowListeners(show)
    }
  }

  /**
   * Load all shows from database
   */
  async loadShows(): Promise<ShowProfile[]> {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load shows:', error)
      throw error
    }

    this.shows = data || []
    this.notifyListeners()
    return this.shows
  }

  /**
   * Get show by ID
   */
  async getShowById(id: string): Promise<ShowProfile | null> {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to get show:', error)
      return null
    }

    return data
  }

  /**
   * Get show by slug
   */
  async getShowBySlug(slug: string): Promise<ShowProfile | null> {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Failed to get show by slug:', error)
      return null
    }

    return data
  }

  /**
   * Create a new show
   */
  async createShow(show: Partial<ShowProfile>): Promise<ShowProfile> {
    // Generate slug from name if not provided
    const slug = show.slug || this.generateSlug(show.name || 'untitled-show')

    const { data, error } = await supabase
      .from('shows')
      .insert({
        ...show,
        slug,
        is_active: false,
        is_archived: false,
        is_template: show.is_template || false,
        episode_count: 0,
        total_episodes: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create show:', error)
      throw error
    }

    await this.loadShows()
    return data
  }

  /**
   * Update a show
   */
  async updateShow(id: string, updates: Partial<ShowProfile>): Promise<ShowProfile> {
    const { data, error } = await supabase
      .from('shows')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update show:', error)
      throw error
    }

    await this.loadShows()

    // If this is the active show, notify listeners
    if (id === this.activeShowId) {
      this.notifyActiveShowListeners(data)
    }

    return data
  }

  /**
   * Delete a show
   */
  async deleteShow(id: string): Promise<void> {
    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete show:', error)
      throw error
    }

    // If this was the active show, clear it
    if (id === this.activeShowId) {
      await this.setActiveShow(null)
    }

    await this.loadShows()
  }

  /**
   * Archive a show
   */
  async archiveShow(id: string): Promise<void> {
    await this.updateShow(id, {
      is_archived: true,
      is_active: false
    })

    // If this was the active show, clear it
    if (id === this.activeShowId) {
      await this.setActiveShow(null)
    }
  }

  /**
   * Unarchive a show
   */
  async unarchiveShow(id: string): Promise<void> {
    await this.updateShow(id, {
      is_archived: false
    })
  }

  /**
   * Duplicate a show
   */
  async duplicateShow(id: string, newName?: string): Promise<ShowProfile> {
    const original = this.shows.find(s => s.id === id)
    if (!original) {
      throw new Error('Show not found')
    }

    const name = newName || `${original.name} (Copy)`
    const slug = this.generateSlug(name)

    const duplicate: Partial<ShowProfile> = {
      name,
      slug,
      description: original.description,
      primary_color: original.primary_color,
      secondary_color: original.secondary_color,
      schedule_type: original.schedule_type,
      schedule_day: original.schedule_day,
      schedule_time: original.schedule_time,
      timezone: original.timezone,
      default_automation_config: original.default_automation_config,
      default_obs_scene: original.default_obs_scene,
      is_template: false
    }

    return await this.createShow(duplicate)
  }

  /**
   * Create show from template
   */
  async createFromTemplate(templateId: string, name: string): Promise<ShowProfile> {
    return await this.duplicateShow(templateId, name)
  }

  /**
   * Set active show
   */
  async setActiveShow(showId: string | null): Promise<void> {
    // Deactivate all shows first
    if (showId) {
      await supabase
        .from('shows')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Activate the selected show
      await supabase
        .from('shows')
        .update({ is_active: true })
        .eq('id', showId)
    }

    this.activeShowId = showId

    // Store in localStorage
    if (showId) {
      localStorage.setItem('activeShowId', showId)
    } else {
      localStorage.removeItem('activeShowId')
    }

    // Notify listeners
    const show = showId ? await this.getShowById(showId) : null
    this.notifyActiveShowListeners(show)
    await this.loadShows()
  }

  /**
   * Get active show
   */
  getActiveShow(): ShowProfile | null {
    if (!this.activeShowId) return null
    return this.shows.find(s => s.id === this.activeShowId) || null
  }

  /**
   * Get active show ID
   */
  getActiveShowId(): string | null {
    return this.activeShowId
  }

  /**
   * Filter shows
   */
  filterShows(filter: ShowFilter): ShowProfile[] {
    let filtered = [...this.shows]

    if (filter.search) {
      const search = filter.search.toLowerCase()
      filtered = filtered.filter(show =>
        show.name.toLowerCase().includes(search) ||
        show.description?.toLowerCase().includes(search) ||
        show.slug.toLowerCase().includes(search)
      )
    }

    if (filter.is_active !== undefined) {
      filtered = filtered.filter(show => show.is_active === filter.is_active)
    }

    if (filter.is_archived !== undefined) {
      filtered = filtered.filter(show => show.is_archived === filter.is_archived)
    }

    if (filter.is_template !== undefined) {
      filtered = filtered.filter(show => show.is_template === filter.is_template)
    }

    if (filter.created_by) {
      filtered = filtered.filter(show => show.created_by === filter.created_by)
    }

    if (filter.team_id) {
      filtered = filtered.filter(show => show.team_id === filter.team_id)
    }

    return filtered
  }

  /**
   * Get built-in show templates
   */
  getBuiltInTemplates(): ShowTemplate[] {
    return [
      {
        name: 'Tech Talk Show',
        description: 'Discussion show focused on technology and software',
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        default_automation_config: {
          autoExecuteThreshold: 0.85,
          requireApprovalThreshold: 0.65,
          autoExecutionEnabled: false
        },
        schedule_type: 'weekly'
      },
      {
        name: 'Interview Series',
        description: 'One-on-one interviews with industry experts',
        primary_color: '#ec4899',
        secondary_color: '#f43f5e',
        default_automation_config: {
          autoExecuteThreshold: 0.80,
          requireApprovalThreshold: 0.60,
          autoExecutionEnabled: false
        },
        schedule_type: 'weekly'
      },
      {
        name: 'Gaming Stream',
        description: 'Live gaming with audience interaction',
        primary_color: '#10b981',
        secondary_color: '#14b8a6',
        default_automation_config: {
          autoExecuteThreshold: 0.90,
          requireApprovalThreshold: 0.75,
          autoExecutionEnabled: true
        },
        schedule_type: 'daily'
      },
      {
        name: 'Educational Workshop',
        description: 'Teaching and tutorial sessions',
        primary_color: '#f59e0b',
        secondary_color: '#f97316',
        default_automation_config: {
          autoExecuteThreshold: 0.75,
          requireApprovalThreshold: 0.55,
          autoExecutionEnabled: false
        },
        schedule_type: 'weekly'
      },
      {
        name: 'News & Updates',
        description: 'Regular news roundup and commentary',
        primary_color: '#ef4444',
        secondary_color: '#dc2626',
        default_automation_config: {
          autoExecuteThreshold: 0.95,
          requireApprovalThreshold: 0.80,
          autoExecutionEnabled: true
        },
        schedule_type: 'daily'
      }
    ]
  }

  /**
   * Install a built-in template
   */
  async installTemplate(templateIndex: number, customName?: string): Promise<ShowProfile> {
    const templates = this.getBuiltInTemplates()
    const template = templates[templateIndex]

    if (!template) {
      throw new Error('Template not found')
    }

    const show: Partial<ShowProfile> = {
      name: customName || template.name,
      description: template.description,
      primary_color: template.primary_color,
      secondary_color: template.secondary_color,
      default_automation_config: template.default_automation_config,
      schedule_type: template.schedule_type,
      is_template: false
    }

    return await this.createShow(show)
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 6)
    return `${slug}-${suffix}`
  }

  /**
   * Subscribe to show changes
   */
  subscribe(callback: (shows: ShowProfile[]) => void): () => void {
    this.listeners.add(callback)
    callback(this.shows) // Initial call

    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Subscribe to active show changes
   */
  subscribeToActiveShow(callback: (show: ShowProfile | null) => void): () => void {
    this.activeShowListeners.add(callback)
    callback(this.getActiveShow()) // Initial call

    return () => {
      this.activeShowListeners.delete(callback)
    }
  }

  /**
   * Notify listeners of show changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.shows))
  }

  /**
   * Notify active show listeners
   */
  private notifyActiveShowListeners(show: ShowProfile | null) {
    this.activeShowListeners.forEach(listener => listener(show))
  }

  /**
   * Get all shows
   */
  getShows(): ShowProfile[] {
    return this.shows
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this.listeners.clear()
    this.activeShowListeners.clear()
  }

  /**
   * Export show configuration
   */
  exportShow(id: string): string {
    const show = this.shows.find(s => s.id === id)
    if (!show) {
      throw new Error('Show not found')
    }

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      show: {
        name: show.name,
        description: show.description,
        primary_color: show.primary_color,
        secondary_color: show.secondary_color,
        schedule_type: show.schedule_type,
        schedule_day: show.schedule_day,
        schedule_time: show.schedule_time,
        timezone: show.timezone,
        default_automation_config: show.default_automation_config,
        default_obs_scene: show.default_obs_scene
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import show configuration
   */
  async importShow(jsonString: string): Promise<ShowProfile> {
    const importData = JSON.parse(jsonString)

    if (!importData.show) {
      throw new Error('Invalid show export format')
    }

    const show: Partial<ShowProfile> = {
      ...importData.show,
      name: `${importData.show.name} (Imported)`,
      is_template: false
    }

    return await this.createShow(show)
  }

  /**
   * Update episode count
   */
  async incrementEpisodeCount(showId: string): Promise<void> {
    const show = this.shows.find(s => s.id === showId)
    if (!show) return

    await this.updateShow(showId, {
      episode_count: show.episode_count + 1,
      total_episodes: show.total_episodes + 1,
      last_aired_at: new Date().toISOString()
    })
  }

  /**
   * Update show statistics
   */
  async updateShowStats(
    showId: string,
    stats: {
      watch_time?: number
      viewer_count?: number
    }
  ): Promise<void> {
    const show = this.shows.find(s => s.id === showId)
    if (!show) return

    const updates: Partial<ShowProfile> = {}

    if (stats.watch_time !== undefined) {
      updates.total_watch_time = (show.total_watch_time || 0) + stats.watch_time
    }

    if (stats.viewer_count !== undefined) {
      // Calculate new average
      const currentAvg = show.avg_viewer_count || 0
      const episodeCount = show.episode_count || 1
      updates.avg_viewer_count = (currentAvg * episodeCount + stats.viewer_count) / (episodeCount + 1)
    }

    if (Object.keys(updates).length > 0) {
      await this.updateShow(showId, updates)
    }
  }
}

// Export singleton instance
export const showManager = new ShowManager()
