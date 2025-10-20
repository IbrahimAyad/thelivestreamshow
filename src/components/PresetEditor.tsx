import { useState, useEffect } from 'react'
import { PresetManager, ScenePreset, PresetCategory, PresetAction } from '../lib/presets/PresetManager'
import { AutomationConfig } from '../lib/automation/AutomationEngine'
import { TriggerRule } from '../lib/automation/types'
import {
  Save, X, Plus, Trash2, MoveUp, MoveDown, Tag,
  Settings, Zap, List, Eye, Layers
} from 'lucide-react'

interface PresetEditorProps {
  presetId?: string // If editing existing preset
  onSave?: (preset: ScenePreset) => void
  onCancel?: () => void
}

export function PresetEditor({ presetId, onSave, onCancel }: PresetEditorProps) {
  const [presetManager] = useState(() => new PresetManager())

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PresetCategory>('custom')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // Automation config
  const [automationEnabled, setAutomationEnabled] = useState(false)
  const [autoExecuteThreshold, setAutoExecuteThreshold] = useState(0.85)
  const [requireApprovalThreshold, setRequireApprovalThreshold] = useState(0.60)
  const [autoExecutionEnabled, setAutoExecutionEnabled] = useState(false)

  // Trigger rules
  const [triggerRules, setTriggerRules] = useState<Partial<TriggerRule>[]>([])

  // Action sequence
  const [actionSequence, setActionSequence] = useState<PresetAction[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing preset if editing
  useEffect(() => {
    if (presetId) {
      const preset = presetManager.getPresetById(presetId)
      if (preset) {
        setName(preset.name)
        setDescription(preset.description)
        setCategory(preset.category)
        setTags(preset.tags)
        setIsPublic(preset.is_public)

        if (preset.automation_config) {
          setAutomationEnabled(true)
          setAutoExecuteThreshold(preset.automation_config.autoExecuteThreshold || 0.85)
          setRequireApprovalThreshold(preset.automation_config.requireApprovalThreshold || 0.60)
          setAutoExecutionEnabled(preset.automation_config.autoExecutionEnabled || false)
        }

        if (preset.trigger_rules) {
          setTriggerRules(preset.trigger_rules)
        }

        if (preset.action_sequence) {
          setActionSequence(preset.action_sequence)
        }
      }
    }
  }, [presetId, presetManager])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleAddTriggerRule = () => {
    setTriggerRules([
      ...triggerRules,
      {
        trigger_type: 'keyword',
        keyword: '',
        confidence_boost: 0.15,
        is_active: true
      }
    ])
  }

  const handleUpdateTriggerRule = (index: number, updates: Partial<TriggerRule>) => {
    const newRules = [...triggerRules]
    newRules[index] = { ...newRules[index], ...updates }
    setTriggerRules(newRules)
  }

  const handleRemoveTriggerRule = (index: number) => {
    setTriggerRules(triggerRules.filter((_, i) => i !== index))
  }

  const handleAddAction = () => {
    setActionSequence([
      ...actionSequence,
      {
        action_type: 'show_graphic',
        params: {},
        delay_ms: 0
      }
    ])
  }

  const handleUpdateAction = (index: number, updates: Partial<PresetAction>) => {
    const newActions = [...actionSequence]
    newActions[index] = { ...newActions[index], ...updates }
    setActionSequence(newActions)
  }

  const handleRemoveAction = (index: number) => {
    setActionSequence(actionSequence.filter((_, i) => i !== index))
  }

  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newActions = [...actionSequence]
      const temp = newActions[index]
      newActions[index] = newActions[index - 1]
      newActions[index - 1] = temp
      setActionSequence(newActions)
    } else if (direction === 'down' && index < actionSequence.length - 1) {
      const newActions = [...actionSequence]
      const temp = newActions[index]
      newActions[index] = newActions[index + 1]
      newActions[index + 1] = temp
      setActionSequence(newActions)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validate
      if (!name.trim()) {
        throw new Error('Preset name is required')
      }

      const presetData: Partial<ScenePreset> = {
        name: name.trim(),
        description: description.trim(),
        category,
        tags,
        is_public: isPublic,
        automation_config: automationEnabled ? {
          autoExecuteThreshold,
          requireApprovalThreshold,
          autoExecutionEnabled
        } : undefined,
        trigger_rules: triggerRules.length > 0 ? triggerRules : undefined,
        action_sequence: actionSequence.length > 0 ? actionSequence : undefined
      }

      let savedPreset: ScenePreset
      if (presetId) {
        // Update existing
        savedPreset = await presetManager.updatePreset(presetId, presetData)
      } else {
        // Create new
        savedPreset = await presetManager.createPreset(presetData as Omit<ScenePreset, 'id' | 'created_at' | 'updated_at' | 'use_count' | 'is_favorite'>)
      }

      onSave?.(savedPreset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset')
    } finally {
      setLoading(false)
    }
  }

  const categories: { value: PresetCategory; label: string; icon: string }[] = [
    { value: 'intro', label: 'Intro', icon: '🎬' },
    { value: 'outro', label: 'Outro', icon: '🎭' },
    { value: 'interview', label: 'Interview', icon: '🎤' },
    { value: 'discussion', label: 'Discussion', icon: '💬' },
    { value: 'presentation', label: 'Presentation', icon: '📊' },
    { value: 'qa', label: 'Q&A', icon: '❓' },
    { value: 'break', label: 'Break', icon: '⏸️' },
    { value: 'technical', label: 'Technical', icon: '🔧' },
    { value: 'custom', label: 'Custom', icon: '⚙️' }
  ]

  const actionTypes = [
    'show_graphic', 'hide_graphic', 'show_lower_third', 'hide_lower_third',
    'play_sound', 'switch_camera', 'show_question', 'hide_question',
    'activate_segment', 'trigger_betabot', 'show_popup'
  ]

  const triggerTypes = ['keyword', 'sentiment', 'pause', 'question_mark', 'time_based']

  return (
    <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-7 h-7 text-purple-400" />
          {presetId ? 'Edit Preset' : 'Create New Preset'}
        </h2>
        <div className="flex gap-2">
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
            {loading ? 'Saving...' : 'Save Preset'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preset Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Interview Setup"
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
                placeholder="Describe what this preset does..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      category === cat.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-purple-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="is-public" className="text-sm text-gray-300">
                Make this preset public (visible to all users)
              </label>
            </div>
          </div>
        </div>

        {/* Automation Configuration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Automation Configuration
          </h3>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="automation-enabled"
              checked={automationEnabled}
              onChange={(e) => setAutomationEnabled(e.target.checked)}
              className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
            />
            <label htmlFor="automation-enabled" className="text-sm font-medium text-gray-300">
              Include automation settings in this preset
            </label>
          </div>

          {automationEnabled && (
            <div className="space-y-4 pl-6 border-l-2 border-yellow-500/30">
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
                <p className="text-xs text-gray-400 mt-1">
                  Actions above this confidence will execute automatically
                </p>
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
                <p className="text-xs text-gray-400 mt-1">
                  Actions above this will appear as suggestions
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-execution-enabled"
                  checked={autoExecutionEnabled}
                  onChange={(e) => setAutoExecutionEnabled(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                />
                <label htmlFor="auto-execution-enabled" className="text-sm text-gray-300">
                  Enable automatic execution (hands-free mode)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Trigger Rules */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              Trigger Rules ({triggerRules.length})
            </h3>
            <button
              onClick={handleAddTriggerRule}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </div>

          <div className="space-y-3">
            {triggerRules.map((rule, index) => (
              <div key={index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Trigger Type</label>
                    <select
                      value={rule.trigger_type}
                      onChange={(e) => handleUpdateTriggerRule(index, { trigger_type: e.target.value as any })}
                      className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    >
                      {triggerTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {rule.trigger_type === 'keyword' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Keyword</label>
                      <input
                        type="text"
                        value={rule.keyword || ''}
                        onChange={(e) => handleUpdateTriggerRule(index, { keyword: e.target.value })}
                        className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        placeholder="e.g., question"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Confidence Boost</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={rule.confidence_boost || 0.15}
                      onChange={(e) => handleUpdateTriggerRule(index, { confidence_boost: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.is_active !== false}
                      onChange={(e) => handleUpdateTriggerRule(index, { is_active: e.target.checked })}
                      className="w-3 h-3 text-green-600 bg-gray-600 border-gray-500 rounded"
                    />
                    <span className="text-xs text-gray-400">Active</span>
                  </div>

                  <button
                    onClick={() => handleRemoveTriggerRule(index)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {triggerRules.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No trigger rules added yet. Click "Add Rule" to create one.
              </div>
            )}
          </div>
        </div>

        {/* Action Sequence */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <List className="w-5 h-5 text-blue-400" />
              Action Sequence ({actionSequence.length})
            </h3>
            <button
              onClick={handleAddAction}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Action
            </button>
          </div>

          <div className="space-y-3">
            {actionSequence.map((action, index) => (
              <div key={index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveAction(index, 'up')}
                      disabled={index === 0}
                      className="p-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveAction(index, 'down')}
                      disabled={index === actionSequence.length - 1}
                      className="p-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Action Type</label>
                    <select
                      value={action.action_type}
                      onChange={(e) => handleUpdateAction(index, { action_type: e.target.value as any })}
                      className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    >
                      {actionTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Delay (ms)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={action.delay_ms}
                      onChange={(e) => handleUpdateAction(index, { delay_ms: parseInt(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleRemoveAction(index)}
                      className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {actionSequence.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No actions added yet. Click "Add Action" to create a sequence.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
