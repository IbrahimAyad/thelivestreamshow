import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Film, Plus, Edit2, Trash2, Check, X, Calendar, Users } from 'lucide-react'

interface Show {
  id: string
  name: string
}

interface Episode {
  id: string
  show_id: string
  season_number: number
  episode_number: number
  title: string
  description: string | null
  air_date: string | null
  status: string
  is_live: boolean
}

interface Guest {
  id: string
  name: string
  title: string | null
  photo_url: string | null
}

interface EpisodeGuest {
  episode_id: string
  guest_id: string
  role: string
  is_featured: boolean
  appearance_order: number
}

export function EpisodeManager() {
  const [shows, setShows] = useState<Show[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [episodeGuests, setEpisodeGuests] = useState<Record<string, Guest[]>>({})
  const [selectedShowId, setSelectedShowId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    show_id: '',
    season_number: 1,
    episode_number: 1,
    title: '',
    description: '',
    air_date: new Date().toISOString().split('T')[0],
    status: 'planning'
  })

  useEffect(() => {
    loadShows()
  }, [])

  useEffect(() => {
    if (selectedShowId) {
      loadEpisodes(selectedShowId)
      loadGuests(selectedShowId)
    }
  }, [selectedShowId])

  const loadShows = async () => {
    const { data } = await supabase
      .from('shows')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    if (data) {
      setShows(data as Show[])
      if (data.length > 0 && !selectedShowId) {
        setSelectedShowId(data[0].id)
      }
    }
  }

  const loadEpisodes = async (showId: string) => {
    const { data } = await supabase
      .from('episodes')
      .select('*')
      .eq('show_id', showId)
      .order('season_number', { ascending: false })
      .order('episode_number', { ascending: false })
    
    if (data) {
      setEpisodes(data as Episode[])
      // Load guests for each episode
      loadEpisodeGuests(data.map(ep => ep.id))
    }
  }

  const loadGuests = async (showId: string) => {
    const { data } = await supabase
      .from('guests')
      .select('id, name, title, photo_url')
      .eq('show_id', showId)
      .order('name')
    
    if (data) setGuests(data as Guest[])
  }

  const loadEpisodeGuests = async (episodeIds: string[]) => {
    if (episodeIds.length === 0) return

    const { data } = await supabase
      .from('episode_guests')
      .select(`
        episode_id,
        guest_id,
        guests:guest_id (id, name, title, photo_url)
      `)
      .in('episode_id', episodeIds)
      .order('appearance_order')

    if (data) {
      const guestsByEpisode: Record<string, Guest[]> = {}
      data.forEach((item: any) => {
        if (!guestsByEpisode[item.episode_id]) {
          guestsByEpisode[item.episode_id] = []
        }
        if (item.guests) {
          guestsByEpisode[item.episode_id].push(item.guests)
        }
      })
      setEpisodeGuests(guestsByEpisode)
    }
  }

  const getNextEpisodeNumber = () => {
    if (episodes.length === 0) return 1
    const latestEpisode = episodes[0]
    return latestEpisode.episode_number + 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let episodeId: string

      if (editingEpisode) {
        const { error } = await supabase
          .from('episodes')
          .update(formData)
          .eq('id', editingEpisode.id)
        
        if (error) throw error
        episodeId = editingEpisode.id

        // Delete existing guest assignments
        await supabase
          .from('episode_guests')
          .delete()
          .eq('episode_id', episodeId)
      } else {
        const { data, error } = await supabase
          .from('episodes')
          .insert([formData])
          .select()
          .single()
        
        if (error) throw error
        episodeId = data.id
      }

      // Insert guest assignments
      if (selectedGuestIds.length > 0) {
        const guestAssignments = selectedGuestIds.map((guestId, index) => ({
          episode_id: episodeId,
          guest_id: guestId,
          role: 'guest',
          is_featured: index === 0,
          appearance_order: index + 1
        }))

        const { error: guestError } = await supabase
          .from('episode_guests')
          .insert(guestAssignments)
        
        if (guestError) throw guestError
      }

      toast.success(editingEpisode ? 'Episode updated successfully!' : 'Episode created successfully!')
      resetForm()
      loadEpisodes(selectedShowId)
    } catch (error: any) {
      console.error('Error saving episode:', error)
      toast.error(`Failed to save episode: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this episode?')) {
      try {
        // Delete guest assignments first
        await supabase
          .from('episode_guests')
          .delete()
          .eq('episode_id', id)

        // Delete episode
        const { error } = await supabase
          .from('episodes')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        toast.success('Episode deleted successfully!')
        loadEpisodes(selectedShowId)
      } catch (error: any) {
        toast.error(`Failed to delete episode: ${error.message}`)
      }
    }
  }

  const handleEdit = async (episode: Episode) => {
    setEditingEpisode(episode)
    setFormData({
      show_id: episode.show_id,
      season_number: episode.season_number,
      episode_number: episode.episode_number,
      title: episode.title,
      description: episode.description || '',
      air_date: episode.air_date ? new Date(episode.air_date).toISOString().split('T')[0] : '',
      status: episode.status
    })

    // Load current guest assignments
    const { data } = await supabase
      .from('episode_guests')
      .select('guest_id')
      .eq('episode_id', episode.id)
      .order('appearance_order')
    
    if (data) {
      setSelectedGuestIds(data.map(eg => eg.guest_id))
    }

    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingEpisode(null)
    setSelectedGuestIds([])
    setFormData({
      show_id: selectedShowId,
      season_number: 1,
      episode_number: getNextEpisodeNumber(),
      title: '',
      description: '',
      air_date: new Date().toISOString().split('T')[0],
      status: 'planning'
    })
  }

  const handleNewEpisode = () => {
    resetForm()
    setShowForm(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'planning': 'bg-gray-600',
      'scheduled': 'bg-blue-600',
      'live': 'bg-red-600 animate-pulse',
      'recorded': 'bg-green-600',
      'archived': 'bg-purple-600'
    }
    return colors[status] || 'bg-gray-600'
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-purple-500" />
          Episode Management
        </h2>
        <button
          onClick={handleNewEpisode}
          className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold flex items-center gap-2"
          disabled={!selectedShowId}
        >
          <Plus className="w-4 h-4" />
          New Episode
        </button>
      </div>

      {shows.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          Please create a show first!
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Select Show</label>
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
            >
              {shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.name}
                </option>
              ))}
            </select>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-4 rounded-lg mb-4 border border-[#3a3a3a]">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Season</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.season_number}
                    onChange={(e) => setFormData({ ...formData, season_number: parseInt(e.target.value) })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Episode #</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.episode_number}
                    onChange={(e) => setFormData({ ...formData, episode_number: parseInt(e.target.value) })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                  >
                    <option value="planning">Planning</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="recorded">Recorded</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Episode Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                    placeholder="e.g., AI in 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Air Date</label>
                  <input
                    type="date"
                    value={formData.air_date}
                    onChange={(e) => setFormData({ ...formData, air_date: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                    rows={2}
                    placeholder="Brief episode description..."
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assign Guests
                  </label>
                  {guests.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No guests available. Add guests in the Guest Management section first.</p>
                  ) : (
                    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded p-3 max-h-48 overflow-y-auto">
                      {guests.map((guest) => (
                        <label key={guest.id} className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGuestIds.includes(guest.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGuestIds([...selectedGuestIds, guest.id])
                              } else {
                                setSelectedGuestIds(selectedGuestIds.filter(id => id !== guest.id))
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                          />
                          {guest.photo_url && (
                            <img src={guest.photo_url} alt={guest.name} className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <div className="flex-1">
                            <div className="text-white text-sm">{guest.name}</div>
                            {guest.title && <div className="text-gray-400 text-xs">{guest.title}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedGuestIds.length > 0 && (
                    <p className="text-xs text-green-400 mt-2">✓ {selectedGuestIds.length} guest(s) selected</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingEpisode ? 'Update Episode' : 'Create Episode'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className="bg-[#1a1a1a] p-3 rounded border border-[#3a3a3a] hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-400">
                        S{episode.season_number}E{episode.episode_number}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(episode.status)}`}>
                        {episode.status}
                      </span>
                      {episode.air_date && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(episode.air_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{episode.title}</h3>
                    {episode.description && (
                      <p className="text-sm text-gray-400 mt-1">{episode.description}</p>
                    )}
                    {episodeGuests[episode.id] && episodeGuests[episode.id].length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="w-3 h-3 text-purple-400" />
                        <div className="flex gap-1 flex-wrap">
                          {episodeGuests[episode.id].map((guest) => (
                            <span key={guest.id} className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                              {guest.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(episode)}
                      className="p-2 bg-purple-600/20 hover:bg-purple-600 rounded text-purple-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(episode.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {episodes.length === 0 && !showForm && (
              <div className="text-center text-gray-400 py-8">
                No episodes yet. Click "New Episode" to create one!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
