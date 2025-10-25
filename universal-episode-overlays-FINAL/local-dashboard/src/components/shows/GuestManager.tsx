import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { validateFile, FileValidationError } from '../../utils/fileValidation'
import { Users, Plus, Edit, Trash2, Search, Upload, X } from 'lucide-react'

interface Guest {
  id: string
  name: string
  title: string | null
  company: string | null
  bio: string | null
  photo_url: string | null
  twitter: string | null
  instagram: string | null
  linkedin: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export function GuestManager() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [bio, setBio] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [twitter, setTwitter] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    loadGuests()
  }, [])

  const loadGuests = async () => {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .order('name')
    
    if (data) setGuests(data as Guest[])
  }

  const openForm = (guest?: Guest) => {
    if (guest) {
      setEditingGuest(guest)
      setName(guest.name)
      setTitle(guest.title || '')
      setCompany(guest.company || '')
      setBio(guest.bio || '')
      setTwitter(guest.twitter || '')
      setInstagram(guest.instagram || '')
      setLinkedin(guest.linkedin || '')
      setWebsite(guest.website || '')
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingGuest(null)
    setName('')
    setTitle('')
    setCompany('')
    setBio('')
    setPhotoFile(null)
    setTwitter('')
    setInstagram('')
    setLinkedin('')
    setWebsite('')
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    
    try {
      validateFile(file, {
        maxSizeMB: 5,
        allowedTypes: ['image/*']
      })
      setPhotoFile(file)
    } catch (err) {
      if (err instanceof FileValidationError) {
        toast.error(err.message)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Guest name is required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      let photoUrl = editingGuest?.photo_url || null
      
      // Upload photo if new file selected
      if (photoFile) {
        const fileName = `${Date.now()}-${photoFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('guest-photos')
          .upload(fileName, photoFile)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('guest-photos')
          .getPublicUrl(fileName)
        
        photoUrl = publicUrl
      }
      
      const guestData = {
        name: name.trim(),
        title: title.trim() || null,
        company: company.trim() || null,
        bio: bio.trim() || null,
        photo_url: photoUrl,
        twitter: twitter.trim() || null,
        instagram: instagram.trim() || null,
        linkedin: linkedin.trim() || null,
        website: website.trim() || null,
        updated_at: new Date().toISOString()
      }
      
      if (editingGuest) {
        const { error } = await supabase
          .from('guests')
          .update(guestData)
          .eq('id', editingGuest.id)
        
        if (error) throw error
        toast.success('Guest updated successfully')
      } else {
        const { error } = await supabase
          .from('guests')
          .insert({ ...guestData, created_at: new Date().toISOString() })
        
        if (error) throw error
        toast.success('Guest created successfully')
      }
      
      loadGuests()
      setShowForm(false)
      resetForm()
    } catch (err: any) {
      console.error('Error saving guest:', err)
      toast.error('Failed to save guest')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (guest: Guest) => {
    if (!confirm(`Delete ${guest.name}? This action cannot be undone.`)) return
    
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guest.id)
      
      if (error) throw error
      
      toast.success('Guest deleted successfully')
      loadGuests()
    } catch (err) {
      console.error('Error deleting guest:', err)
      toast.error('Failed to delete guest')
    }
  }

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          Guest Management
          <span className="text-sm font-normal text-gray-400">({guests.length} total)</span>
        </h2>
        <button
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Guest
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests by name, company, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
          />
        </div>
      </div>

      {/* Guest Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {editingGuest ? 'Edit Guest' : 'Add New Guest'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
                      placeholder="e.g., CEO, Author, Expert"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Company/Organization</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
                    placeholder="Short biography or description..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {(photoFile || editingGuest?.photo_url) && (
                    <div className="mt-2">
                      {photoFile ? (
                        <p className="text-xs text-green-400">New photo: {photoFile.name}</p>
                      ) : editingGuest?.photo_url ? (
                        <img src={editingGuest.photo_url} alt="Current" className="w-20 h-20 rounded object-cover" />
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#3a3a3a] pt-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Social Media</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Twitter</label>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Instagram</label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">LinkedIn</label>
                      <input
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="Profile URL"
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Website</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (editingGuest ? 'Update Guest' : 'Create Guest')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Guest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map(guest => (
          <div key={guest.id} className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] p-4 hover:border-blue-500/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 overflow-hidden">
                {guest.photo_url ? (
                  <img src={guest.photo_url} alt={guest.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                    {guest.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{guest.name}</h3>
                {guest.title && <p className="text-sm text-gray-400 truncate">{guest.title}</p>}
                {guest.company && <p className="text-xs text-gray-500 truncate">{guest.company}</p>}
              </div>
            </div>
            
            {guest.bio && (
              <p className="text-sm text-gray-300 mt-3 line-clamp-2">{guest.bio}</p>
            )}
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => openForm(guest)}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold flex items-center justify-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(guest)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{searchTerm ? 'No guests found matching your search' : 'No guests yet'}</p>
          <p className="text-sm mt-2">Click "Add Guest" to create your first guest profile</p>
        </div>
      )}
    </div>
  )
}
