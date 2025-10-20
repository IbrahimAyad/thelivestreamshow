import { useState, useEffect } from 'react'
import { ShowManager, ShowProfile, ShowTemplate } from '../lib/shows/ShowManager'
import { Save, X, Tv, Palette, Calendar, Settings, Sparkles } from 'lucide-react'

interface ShowEditorProps {
  showId?: string
  onSave?: (show: ShowProfile) => void
  onCancel?: () => void
}

export function ShowEditor({ showId, onSave, onCancel }: ShowEditorProps) {
  const [showManager] = useState(() => new ShowManager())

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6')
  const [secondaryColor, setSecondaryColor] = useState('#ec4899')
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly')
  const [scheduleDay, setScheduleDay] = useState(1)
  const [scheduleTime, setScheduleTime] = useState('19:00')
  const [timezone, setTimezone] = useState('America/New_York')
  const [defaultOBSScene, setDefaultOBSScene] = useState('')
  const [autoExecuteThreshold, setAutoExecuteThreshold] = useState(0.85)
  const [requireApprovalThreshold, setRequireApprovalThreshold] = useState(0.65)
  const [autoExecutionEnabled, setAutoExecutionEnabled] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // Load existing show if editing
  useEffect(() => {
    if (showId) {
      showManager.getShowById(showId).then(show => {
        if (show) {
          setName(show.name)
          setDescription(show.description || '')
          setPrimaryColor(show.primary_color || '#8b5cf6')
          setSecondaryColor(show.secondary_color || '#ec4899')
          setScheduleType(show.schedule_type || 'weekly')
          setScheduleDay(show.schedule_day || 1)
          setScheduleTime(show.schedule_time || '19:00')
          setTimezone(show.timezone || 'America/New_York')
          setDefaultOBSScene(show.default_obs_scene || '')

          if (show.default_automation_config) {
            setAutoExecuteThreshold(show.default_automation_config.autoExecuteThreshold || 0.85)
            setRequireApprovalThreshold(show.default_automation_config.requireApprovalThreshold || 0.65)
            setAutoExecutionEnabled(show.default_automation_config.autoExecutionEnabled || false)
          }
        }
      })
    }
  }, [showId, showManager])

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!name.trim()) {
        throw new Error('Show name is required')
      }

      const showData: Partial<ShowProfile> = {
        name: name.trim(),
        description: description.trim(),
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        schedule_type: scheduleType,
        schedule_day: scheduleDay,
        schedule_time: scheduleTime,
        timezone,
        default_obs_scene: defaultOBSScene.trim(),
        default_automation_config: {
          autoExecuteThreshold,
          requireApprovalThreshold,
          autoExecutionEnabled
        }
      }

      let savedShow: ShowProfile
      if (showId) {
        savedShow = await showManager.updateShow(showId, showData)
      } else {
        savedShow = await showManager.createShow(showData)
      }

      onSave?.(savedShow)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save show')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = (template: ShowTemplate) => {
    setName(template.name)
    setDescription(template.description)
    setPrimaryColor(template.primary_color)
    setSecondaryColor(template.secondary_color)
    setScheduleType(template.schedule_type)

    if (template.default_automation_config) {
      setAutoExecuteThreshold(template.default_automation_config.autoExecuteThreshold || 0.85)
      setRequireApprovalThreshold(template.default_automation_config.requireApprovalThreshold || 0.65)
      setAutoExecutionEnabled(template.default_automation_config.autoExecutionEnabled || false)
    }

    setShowTemplates(false)
  }

  const templates = showManager.getBuiltInTemplates()
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ]

  return (
    <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Tv className="w-7 h-7 text-purple-400" />
          {showId ? 'Edit Show' : 'Create New Show'}
        </h2>
        <div className="flex gap-2">
          {!showId && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Use Template
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Show'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="mb-6 p-4 bg-gray-800 border-2 border-purple-500/50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Choose a Template</h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleApplyTemplate(template)}
                className="text-left p-4 bg-gray-900 hover:bg-gray-700 border border-gray-600 hover:border-purple-500 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: template.primary_color }}
                  />
                  <h4 className="font-bold text-white">{template.name}</h4>
                </div>
                <p className="text-xs text-gray-400">{template.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <span className="capitalize">{template.schedule_type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Tv className="w-5 h-5 text-blue-400" />
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Show Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Tech Talk Tuesday"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your show..."
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-400" />
            Branding
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-4 p-4 rounded-lg" style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
          }}>
            <p className="text-white font-bold text-center">Color Preview</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-400" />
            Schedule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Schedule Type
              </label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {(scheduleType === 'weekly' || scheduleType === 'monthly') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {scheduleType === 'weekly' ? 'Day of Week' : 'Day of Month'}
                </label>
                <select
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {scheduleType === 'weekly' ? (
                    <>
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </>
                  ) : (
                    Array.from({ length: 31 }, (_, i) => (
                      <option key={i} value={i + 1}>{i + 1}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-yellow-400" />
            Default Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default OBS Scene
              </label>
              <input
                type="text"
                value={defaultOBSScene}
                onChange={(e) => setDefaultOBSScene(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Main Show"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto-Execute Threshold: {(autoExecuteThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={autoExecuteThreshold * 100}
                onChange={(e) => setAutoExecuteThreshold(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Approval Required Threshold: {(requireApprovalThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={requireApprovalThreshold * 100}
                onChange={(e) => setRequireApprovalThreshold(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-execution"
                checked={autoExecutionEnabled}
                onChange={(e) => setAutoExecutionEnabled(e.target.checked)}
                className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
              />
              <label htmlFor="auto-execution" className="text-sm text-gray-300">
                Enable automatic execution by default
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
