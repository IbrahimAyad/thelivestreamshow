import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { validateFile } from '../../utils/fileValidation'
import { Image as ImageIcon, Download, Layers, Play, Upload, Plus, Wand2, Trash2 } from 'lucide-react'

interface MediaLibraryItem {
  id: string
  name: string
  type: string
  file_url: string
  thumbnail_url: string | null
  category: string | null
  show_id: string | null
  tags: string[] | null
  created_at: string
}

interface Show {
  id: string
  name: string
  theme_color: string
}

export function ShowGraphicsGallery() {
  const [shows, setShows] = useState<Show[]>([])
  const [graphics, setGraphics] = useState<MediaLibraryItem[]>([])
  const [selectedShow, setSelectedShow] = useState<string>('all')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    name: '',
    file_url: '',
    category: 'template',
    show_id: '',
    tags: ''
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    loadShows()
    loadGraphics()
    subscribeToChanges()
  }, [])

  const loadShows = async () => {
    const { data } = await supabase
      .from('shows')
      .select('*')
      .order('name')
    
    if (data) setShows(data as Show[])
  }

  const loadGraphics = async () => {
    const { data } = await supabase
      .from('media_library')
      .select('*')
      .eq('type', 'image')
      .order('created_at', { ascending: false })
    
    if (data) setGraphics(data as MediaLibraryItem[])
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('media_library_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'media_library'
      }, () => loadGraphics())
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      try {
        validateFile(file, {
          maxSizeMB: 10,
          allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
          allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']
        })
        setUploadFile(file)
        // Auto-fill name if empty
        if (!uploadData.name) {
          setUploadData({ ...uploadData, name: file.name.replace(/\.[^/.]+$/, '') })
        }
        toast.success(`File selected: ${file.name}`)
      } catch (error: any) {
        toast.error(error.message)
        e.target.value = ''
      }
    }
  }

  const handleUploadGraphic = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadFile) {
      toast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      setUploadProgress(30)
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${uploadFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(fileName, uploadFile)

      if (uploadError) throw uploadError
      
      setUploadProgress(70)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media-library')
        .getPublicUrl(fileName)

      // Insert to database
      const tagsArray = uploadData.tags.split(',').map(t => t.trim()).filter(t => t)
      
      const { error } = await supabase
        .from('media_library')
        .insert({
          name: uploadData.name || uploadFile.name,
          type: 'image',
          file_url: publicUrl,
          file_type: 'image',
          category: uploadData.category,
          show_id: uploadData.show_id || null,
          tags: tagsArray,
          file_size_bytes: uploadFile.size,
          metadata: {}
        })
      
      if (error) throw error
      
      setUploadProgress(100)
      toast.success('Graphic uploaded successfully!')
      setShowUploadForm(false)
      setUploadData({ name: '', file_url: '', category: 'template', show_id: '', tags: '' })
      setUploadFile(null)
      loadGraphics()
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error('Failed to upload graphic: ' + err.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const createSceneFromGraphic = async (graphic: MediaLibraryItem) => {
    try {
      // Create a new scene template from this graphic
      const templateName = `${graphic.name} Scene`
      
      const { error } = await supabase
        .from('scene_templates')
        .insert({
          name: templateName,
          description: `Scene template created from ${graphic.name}`,
          layout_type: graphic.category || 'custom',
          thumbnail_url: graphic.file_url,
          is_custom: true,
          config: {
            show_id: graphic.show_id,
            thumbnail_url: graphic.file_url,
            sources: [
              {
                type: 'image',
                source_url: graphic.file_url,
                position_x: 0,
                position_y: 0,
                width: 1920,
                height: 1080,
                z_index: 1,
                volume: 0,
                config: { graphicName: graphic.name }
              }
            ]
          }
        })
      
      if (error) throw error
      
      toast.success(`Scene template "${templateName}" created! Go to Scenes tab to use it.`)
    } catch (err: any) {
      console.error('Template creation error:', err)
      toast.error('Failed to create template: ' + err.message)
    }
  }

  const handleUseInScene = async (graphic: MediaLibraryItem) => {
    const confirmed = window.confirm(
      `This will replace the current scene with "${graphic.name}". Are you sure?`
    )
    
    if (!confirmed) return
    
    try {
      // Clear existing sources
      await supabase.from('stream_sources').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // Add graphic as background
      await supabase.from('stream_sources').insert({
        source_type: 'image',
        source_url: graphic.file_url,
        position_x: 0,
        position_y: 0,
        width: 1920,
        height: 1080,
        z_index: 1,
        is_active: true,
        volume: 0,
        config: { graphicName: graphic.name }
      })

      toast.success(`"${graphic.name}" added to scene!`)
    } catch (err) {
      console.error('Failed to add graphic to scene:', err)
      toast.error('Failed to add graphic to scene')
    }
  }

  const handleDownload = (graphic: MediaLibraryItem) => {
    const link = document.createElement('a')
    link.href = graphic.file_url
    link.download = graphic.name.replace(/\s+/g, '_') + '.png'
    link.click()
  }

  const handleDeleteGraphic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this graphic?')) return
    
    try {
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Graphic deleted successfully!')
      loadGraphics()
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error('Failed to delete graphic')
    }
  }

  const filteredGraphics = selectedShow === 'all'
    ? graphics
    : graphics.filter(g => g.show_id === selectedShow || g.show_id === null)

  const groupedGraphics = filteredGraphics.reduce((acc, graphic) => {
    let groupName = 'Generic'
    if (graphic.show_id) {
      const show = shows.find(s => s.id === graphic.show_id)
      groupName = show?.name || 'Unknown Show'
    } else if (graphic.category === 'logo') {
      groupName = 'Channel Branding'
    }
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(graphic)
    return acc
  }, {} as Record<string, MediaLibraryItem[]>)

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-purple-500" />
          Show Graphics Gallery
          <span className="text-sm font-normal text-gray-400">({filteredGraphics.length} graphics)</span>
        </h2>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold flex items-center gap-2 transition-colors"
          >
            {showUploadForm ? <Plus className="w-4 h-4 rotate-45" /> : <Upload className="w-4 h-4" />}
            {showUploadForm ? 'Cancel' : 'Upload Graphic'}
          </button>
          
          <label className="text-sm text-gray-400">Filter by Show:</label>
          <select
            value={selectedShow}
            onChange={(e) => setSelectedShow(e.target.value)}
            className="bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
          >
            <option value="all">All Shows</option>
            {shows.map(show => (
              <option key={show.id} value={show.id}>{show.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <form onSubmit={handleUploadGraphic} className="bg-[#1a1a1a] p-6 rounded-lg border border-[#3a3a3a] mb-6">
          <h3 className="text-lg font-semibold mb-4">Upload New Graphic</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Graphic Name *</label>
              <input
                type="text"
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                required
                placeholder="e.g., My Show Intro"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Image File *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                required
              />
              {uploadFile && (
                <p className="text-xs text-green-400 mt-1">✓ Selected: {uploadFile.name}</p>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category *</label>
              <select
                value={uploadData.category}
                onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
              >
                <option value="template">Template</option>
                <option value="lower_third">Lower Third</option>
                <option value="logo">Logo</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Associate with Show</label>
              <select
                value={uploadData.show_id}
                onChange={(e) => setUploadData({ ...uploadData, show_id: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
              >
                <option value="">No Show (Generic)</option>
                {shows.map(show => (
                  <option key={show.id} value={show.id}>{show.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={uploadData.tags}
                onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
                placeholder="intro, branding, professional"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Graphic'}
            </button>
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {Object.entries(groupedGraphics).map(([showName, graphics]) => (
        <div key={showName} className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-300 flex items-center gap-2">
            <div className="w-1 h-6 bg-purple-500 rounded"></div>
            {showName}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {graphics.map((graphic) => (
              <div
                key={graphic.id}
                className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] overflow-hidden hover:border-purple-500/50 transition-all group"
              >
                <div 
                  className="aspect-video bg-gray-900 flex items-center justify-center relative cursor-pointer overflow-hidden"
                  onClick={() => setPreviewImage(graphic.file_url)}
                >
                  <img 
                    src={graphic.file_url} 
                    alt={graphic.name}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = ''
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded capitalize">
                    {graphic.category || 'graphic'}
                  </div>
                  {graphic.tags && graphic.tags.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {graphic.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h4 className="font-semibold text-white mb-3">{graphic.name}</h4>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUseInScene(graphic)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Layers className="w-3 h-3" />
                        Use in Scene
                      </button>
                      <button
                        onClick={() => handleDownload(graphic)}
                        className="bg-[#2a2a2a] hover:bg-[#333] p-2 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteGraphic(graphic.id)}
                        className="bg-red-600/20 hover:bg-red-600 p-2 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => createSceneFromGraphic(graphic)}
                      className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      Create Scene Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredGraphics.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No graphics available for this show</p>
          <p className="text-sm mt-2">Click "Upload Graphic" to add new graphics</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
