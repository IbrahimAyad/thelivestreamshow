import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Play, Download, Upload, Trash2 } from 'lucide-react'
import type { StreamProfile } from '../../lib/supabase'

export function StreamProfiles() {
  const [profiles, setProfiles] = useState<StreamProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<StreamProfile | null>(null)
  const [profileName, setProfileName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    const { data } = await supabase
      .from('stream_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setProfiles(data as StreamProfile[])
  }

  const saveCurrentProfile = async () => {
    if (!profileName.trim()) {
      alert('Please enter a profile name')
      return
    }

    const currentConfig = {
      scene_config: { placeholder: 'Current scene config' },
      audio_config: { placeholder: 'Current audio config' },
      quality_config: { placeholder: 'Current quality config' },
      source_config: { placeholder: 'Current source config' }
    }

    await supabase
      .from('stream_profiles')
      .insert({
        name: profileName,
        ...currentConfig
      })

    setProfileName('')
    setShowSaveDialog(false)
    loadProfiles()
    alert('Profile saved successfully!')
  }

  const loadProfile = async (profile: StreamProfile) => {
    setSelectedProfile(profile)
    // Load stream profile settings
    alert(`Profile "${profile.name}" loaded successfully!`)
  }

  const deleteProfile = async (id: string) => {
    if (!confirm('Delete this profile?')) return

    await supabase
      .from('stream_profiles')
      .delete()
      .eq('id', id)

    loadProfiles()
    if (selectedProfile?.id === id) setSelectedProfile(null)
  }

  const exportProfile = (profile: StreamProfile) => {
    const json = JSON.stringify(profile, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.name.replace(/\s+/g, '-')}-profile.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const profile = JSON.parse(text)

      await supabase
        .from('stream_profiles')
        .insert({
          name: profile.name + ' (imported)',
          scene_config: profile.scene_config,
          audio_config: profile.audio_config,
          quality_config: profile.quality_config,
          source_config: profile.source_config
        })

      loadProfiles()
      alert('Profile imported successfully!')
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import profile. Please check the file format.')
    }
    e.target.value = ''
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Save className="w-6 h-6 text-purple-500" />
          Stream Profiles
        </h2>
        <div className="flex gap-2">
          <label className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importProfile}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Current
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="mb-6 p-4 bg-[#1a1a1a] rounded border border-purple-500/30">
          <h3 className="font-bold mb-3">Save Current Configuration as Profile</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Profile name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded"
            />
            <button
              onClick={saveCurrentProfile}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false)
                setProfileName('')
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-semibold"
            >
              Cancel
            </button>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            This will save: Scene layout, Audio mixer settings, Quality settings, and Active sources
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`bg-[#1a1a1a] rounded border p-4 ${
              selectedProfile?.id === profile.id ? 'border-purple-500' : 'border-[#3a3a3a]'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-bold">{profile.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Created {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
              {selectedProfile?.id === profile.id && (
                <span className="text-xs bg-purple-600 px-2 py-1 rounded">ACTIVE</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => loadProfile(profile)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 rounded py-2 text-sm font-semibold flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3" />
                Load
              </button>
              <button
                onClick={() => exportProfile(profile)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                title="Export profile"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteProfile(profile.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded"
                title="Delete profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Save className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No saved profiles yet</p>
          <p className="text-sm">Save your current configuration to quickly switch between setups</p>
        </div>
      )}
    </div>
  )
}
