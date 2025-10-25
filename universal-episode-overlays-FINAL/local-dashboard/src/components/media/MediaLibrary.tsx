import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Search, Filter, Grid, List, Play, Trash2, Plus, Tag } from 'lucide-react'
import type { MediaLibraryItem } from '../../lib/supabase'

export function MediaLibrary() {
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaLibraryItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadMediaItems()
    subscribeToChanges()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, filterType, searchQuery, selectedCategory])

  const loadMediaItems = async () => {
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data && !error) {
      setItems(data as MediaLibraryItem[])
      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean) as string[])]
      setCategories(uniqueCategories)
    }
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('media_library_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'media_library'
      }, () => {
        loadMediaItems()
      })
      .subscribe()

    return () => channel.unsubscribe()
  }

  const filterItems = () => {
    let filtered = items

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.file_type === filterType)
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setFilteredItems(filtered)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(filePath)

        const fileType = file.type.startsWith('video/') ? 'video' : 'image'

        await supabase
          .from('media_library')
          .insert({
            name: file.name,
            file_url: publicUrl,
            file_type: fileType,
            file_size_bytes: file.size,
            category: 'uncategorized'
          })
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload file: ' + (error as Error).message)
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  const deleteItem = async (id: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) return

    try {
      const filePath = fileUrl.split('/').pop()
      if (filePath) {
        await supabase.storage.from('media-library').remove([filePath])
      }
      
      await supabase
        .from('media_library')
        .delete()
        .eq('id', id)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete item')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-500" />
          Media Library
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-[#1a1a1a]'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600' : 'bg-[#1a1a1a]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <label className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded font-semibold cursor-pointer flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Upload Media
            <input
              type="file"
              multiple
              accept="video/*,image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search media by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
        >
          <option value="all">All Types</option>
          <option value="video">Videos</option>
          <option value="image">Images</option>
        </select>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {uploading && (
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded text-blue-300">
          Uploading files...
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] overflow-hidden group">
              <div className="aspect-video bg-black flex items-center justify-center relative">
                {item.file_type === 'image' ? (
                  <img src={item.file_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.file_url} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {item.file_type === 'video' && (
                    <button className="p-2 bg-blue-600 rounded-full hover:bg-blue-700">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteItem(item.id, item.file_url)}
                    className="p-2 bg-red-600 rounded-full hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm truncate" title={item.name}>{item.name}</div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{item.file_type}</span>
                  <span>{formatFileSize(item.file_size_bytes)}</span>
                </div>
                {item.duration_seconds && (
                  <div className="text-xs text-gray-400 mt-1">{formatDuration(item.duration_seconds)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-[#1a1a1a] rounded border border-[#3a3a3a] p-4 flex items-center gap-4">
              <div className="w-24 h-16 bg-black rounded flex items-center justify-center">
                {item.file_type === 'image' ? (
                  <img src={item.file_url} alt={item.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <video src={item.file_url} className="w-full h-full object-cover rounded" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{item.name}</div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                  <span className="capitalize">{item.file_type}</span>
                  <span>{formatFileSize(item.file_size_bytes)}</span>
                  {item.duration_seconds && <span>{formatDuration(item.duration_seconds)}</span>}
                  {item.category && (
                    <span className="px-2 py-0.5 bg-blue-600/30 rounded text-blue-300 text-xs">{item.category}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {item.file_type === 'video' && (
                  <button className="p-2 bg-blue-600 rounded hover:bg-blue-700">
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id, item.file_url)}
                  className="p-2 bg-red-600 rounded hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No media items found</p>
          <p className="text-sm">Upload videos or images to get started</p>
        </div>
      )}
    </div>
  )
}
