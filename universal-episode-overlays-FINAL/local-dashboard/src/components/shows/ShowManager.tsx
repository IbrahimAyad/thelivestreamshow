import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Tv, Plus, Edit2, Trash2, Check, X, Upload } from 'lucide-react'
import { validateFile } from '../../utils/fileValidation'
import toast from 'react-hot-toast'

interface Show {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string | null
  theme_color: string
  secondary_color: string
  category: string
  social_twitter: string | null
  social_instagram: string | null
  social_youtube: string | null
  default_hashtag: string | null
  is_active: boolean
}

export function ShowManager() {
  const [shows, setShows] = useState<Show[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingShow, setEditingShow] = useState<Show | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    theme_color: '#6366f1',
    secondary_color: '#8b5cf6',
    category: '',
    default_hashtag: '',
    social_twitter: '',
    social_instagram: '',
    social_youtube: ''
  })

  useEffect(() => {
    loadShows()

    const channel = supabase
      .channel('shows_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shows'
      }, () => {
        loadShows()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadShows = async () => {
    const { data } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setShows(data as Show[])
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      validateFile(file, {
        maxSizeMB: 5,
        allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
        allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.svg']
      })
      setLogoFile(file)
      toast.success(`Logo selected: ${file.name}`)
    } catch (error: any) {
      toast.error(error.message)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setUploadProgress(0)

    try {
      let logoUrl = editingShow?.logo_url || null

      // Upload logo if a new file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('show-logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('show-logos')
          .getPublicUrl(filePath)

        logoUrl = publicUrl
        setUploadProgress(100)
      }

      const dataToSave = {
        ...formData,
        logo_url: logoUrl,
        social_twitter: formData.social_twitter || null,
        social_instagram: formData.social_instagram || null,
        social_youtube: formData.social_youtube || null
      }

      if (editingShow) {
        const { error } = await supabase
          .from('shows')
          .update(dataToSave)
          .eq('id', editingShow.id)
        
        if (error) throw error
        toast.success('Show updated successfully!')
      } else {
        const { error } = await supabase
          .from('shows')
          .insert([dataToSave])
        
        if (error) throw error
        toast.success('Show created successfully!')
      }

      resetForm()
      loadShows()
    } catch (error: any) {
      console.error('Error saving show:', error)
      toast.error(`Failed to save show: ${error.message}`)
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      try {
        const { error } = await supabase
          .from('shows')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        toast.success('Show deleted successfully!')
      } catch (error: any) {
        toast.error(`Failed to delete show: ${error.message}`)
      }
    }
  }

  const handleEdit = (show: Show) => {
    setEditingShow(show)
    setFormData({
      name: show.name,
      slug: show.slug,
      description: show.description || '',
      theme_color: show.theme_color,
      secondary_color: show.secondary_color,
      category: show.category || '',
      default_hashtag: show.default_hashtag || '',
      social_twitter: show.social_twitter || '',
      social_instagram: show.social_instagram || '',
      social_youtube: show.social_youtube || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingShow(null)
    setLogoFile(null)
    setUploadProgress(0)
    setFormData({
      name: '',
      slug: '',
      description: '',
      theme_color: '#6366f1',
      secondary_color: '#8b5cf6',
      category: '',
      default_hashtag: '',
      social_twitter: '',
      social_instagram: '',
      social_youtube: ''
    })
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Tv className="w-5 h-5 text-blue-500" />
          Show Management
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold flex items-center gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Show'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-4 rounded-lg mb-4 border border-[#3a3a3a]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Show Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                }}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                placeholder="e.g., Technology, Gaming"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Theme Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                  className="w-12 h-10 bg-[#2a2a2a] border border-[#3a3a3a] rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.theme_color}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                  className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Default Hashtag</label>
              <input
                type="text"
                value={formData.default_hashtag}
                onChange={(e) => setFormData({ ...formData, default_hashtag: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                placeholder="#YourShow"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Show Logo</label>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white hover:border-blue-500 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {logoFile ? logoFile.name : editingShow?.logo_url ? 'Change logo' : 'Upload logo'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
              {logoFile && (
                <p className="text-xs text-green-400 mt-1">✓ Ready to upload</p>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Social Media</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Twitter/X</label>
                  <input
                    type="text"
                    value={formData.social_twitter}
                    onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={formData.social_instagram}
                    onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">YouTube</label>
                  <input
                    type="text"
                    value={formData.social_youtube}
                    onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
                    placeholder="Channel URL"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Saving...' : editingShow ? 'Update Show' : 'Create Show'}
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

      <div className="space-y-2">
        {shows.map((show) => (
          <div
            key={show.id}
            className="bg-[#1a1a1a] p-3 rounded border border-[#3a3a3a] hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: show.theme_color }}
                  />
                  <h3 className="font-semibold text-white">{show.name}</h3>
                  {show.category && (
                    <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                      {show.category}
                    </span>
                  )}
                  {show.default_hashtag && (
                    <span className="text-xs text-gray-400">{show.default_hashtag}</span>
                  )}
                </div>
                {show.description && (
                  <p className="text-sm text-gray-400 mt-1">{show.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(show)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600 rounded text-blue-400 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(show.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {shows.length === 0 && !showForm && (
          <div className="text-center text-gray-400 py-8">
            No shows yet. Click "New Show" to create one!
          </div>
        )}
      </div>
    </div>
  )
}
