import { useState, useEffect } from 'react'
import { supabase, LowerThirdTemplate } from '../lib/supabase'
import { User, Briefcase, Hash, Eye, EyeOff, Save, Sparkles } from 'lucide-react'

const ANIMATION_STYLES = [
  { value: 'slide_left', label: 'Slide Left' },
  { value: 'slide_right', label: 'Slide Right' },
  { value: 'slide_up', label: 'Slide Up' },
  { value: 'fade_in', label: 'Fade In' }
]

export function LowerThirdControl() {
  const [templates, setTemplates] = useState<LowerThirdTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templateName, setTemplateName] = useState<string>('')
  const [guestName, setGuestName] = useState<string>('')
  const [guestTitle, setGuestTitle] = useState<string>('')
  const [guestSocial, setGuestSocial] = useState<string>('')
  const [animationStyle, setAnimationStyle] = useState<string>('slide_left')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()

    // Real-time subscription
    const channel = supabase
      .channel('lower_thirds_templates_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lower_thirds_templates'
      }, () => {
        loadTemplates()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadTemplates = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('lower_thirds_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      if (data) {
        setTemplates(data as LowerThirdTemplate[])
      }
    } catch (err) {
      console.error('Error loading templates:', err)
      setError('Failed to load templates')
    }
  }

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplateId(templateId)
      setTemplateName(template.template_name)
      setGuestName(template.guest_name)
      setGuestTitle(template.guest_title)
      setGuestSocial(template.guest_social)
      setAnimationStyle(template.animation_style)
    }
  }

  const showLowerThird = async () => {
    if (!guestName.trim() || !guestTitle.trim()) {
      setError('Guest name and title are required')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Hide all lower thirds first
      await supabase
        .from('lower_thirds_templates')
        .update({ is_visible: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (selectedTemplateId) {
        // Update and show existing template
        const { error: updateError } = await supabase
          .from('lower_thirds_templates')
          .update({
            guest_name: guestName,
            guest_title: guestTitle,
            guest_social: guestSocial,
            animation_style: animationStyle,
            is_visible: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplateId)

        if (updateError) throw updateError
      } else {
        // Create new template and show it
        const { error: insertError } = await supabase
          .from('lower_thirds_templates')
          .insert({
            template_name: templateName || `${guestName} - Lower Third`,
            guest_name: guestName,
            guest_title: guestTitle,
            guest_social: guestSocial,
            animation_style: animationStyle,
            is_visible: true
          })

        if (insertError) throw insertError
      }

      setSuccessMessage('Lower third is now showing!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error showing lower third:', err)
      setError('Failed to show lower third')
    } finally {
      setIsLoading(false)
    }
  }

  const hideLowerThird = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await supabase
        .from('lower_thirds_templates')
        .update({ is_visible: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      setSuccessMessage('Lower third hidden')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error hiding lower third:', err)
      setError('Failed to hide lower third')
    } finally {
      setIsLoading(false)
    }
  }

  const saveAsNewTemplate = async () => {
    if (!templateName.trim() || !guestName.trim() || !guestTitle.trim()) {
      setError('Template name, guest name, and title are required')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: insertError } = await supabase
        .from('lower_thirds_templates')
        .insert({
          template_name: templateName,
          guest_name: guestName,
          guest_title: guestTitle,
          guest_social: guestSocial,
          animation_style: animationStyle,
          is_visible: false
        })

      if (insertError) throw insertError

      setSuccessMessage('Template saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      
      // Clear form
      setSelectedTemplateId('')
      setTemplateName('')
      setGuestName('')
      setGuestTitle('')
      setGuestSocial('')
    } catch (err) {
      console.error('Error saving template:', err)
      setError('Failed to save template')
    } finally {
      setIsLoading(false)
    }
  }

  const visibleTemplate = templates.find(t => t.is_visible)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-cyan-500" />
        Lower Third Control
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300 text-sm">
          {successMessage}
        </div>
      )}

      <div className="space-y-4">
        {/* Template Selection */}
        {templates.length > 0 && (
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Load Saved Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => loadTemplate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">-- Create New --</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.template_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Template Name */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Template Name
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            placeholder="e.g., Guest Expert Template"
          />
        </div>

        {/* Guest Name */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Guest Name
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            placeholder="John Doe"
          />
        </div>

        {/* Guest Title */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Guest Title
          </label>
          <input
            type="text"
            value={guestTitle}
            onChange={(e) => setGuestTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            placeholder="CEO, Company Name"
          />
        </div>

        {/* Guest Social */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Guest Social Handle (optional)
          </label>
          <input
            type="text"
            value={guestSocial}
            onChange={(e) => setGuestSocial(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            placeholder="@username"
          />
        </div>

        {/* Animation Style */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Animation Style
          </label>
          <select
            value={animationStyle}
            onChange={(e) => setAnimationStyle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          >
            {ANIMATION_STYLES.map(style => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={showLowerThird}
            disabled={isLoading || !guestName.trim() || !guestTitle.trim()}
            className={`py-2.5 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              visibleTemplate
                ? 'bg-cyan-600 border border-cyan-500 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
            } disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed disabled:text-gray-600`}
          >
            <Eye className="w-4 h-4" />
            {visibleTemplate ? 'Lower Third Active' : 'Show Lower Third'}
            {visibleTemplate && (
              <span className="px-1.5 py-0.5 bg-cyan-500 text-white text-xs font-semibold rounded">
                ON
              </span>
            )}
          </button>

          <button
            onClick={hideLowerThird}
            disabled={isLoading || !visibleTemplate}
            className={`py-2.5 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              !visibleTemplate
                ? 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-white'
            } disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed disabled:text-gray-600`}
          >
            <EyeOff className="w-4 h-4" />
            Hide Lower Third
          </button>
        </div>

        <button
          onClick={saveAsNewTemplate}
          disabled={isLoading || !templateName.trim() || !guestName.trim() || !guestTitle.trim()}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save as New Template
        </button>
      </div>

      {/* Preview/Current Display */}
      {visibleTemplate && (
        <div className="mt-6 p-3 bg-gray-800/50 border border-gray-700/50 rounded">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Currently Showing</h3>
            <span className="px-2 py-0.5 bg-green-600/90 text-white text-xs font-semibold rounded">
              LIVE
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-white font-semibold">{visibleTemplate.guest_name}</p>
            <p className="text-gray-300 text-sm">{visibleTemplate.guest_title}</p>
            {visibleTemplate.guest_social && (
              <p className="text-cyan-500 text-sm">{visibleTemplate.guest_social}</p>
            )}
          </div>
        </div>
      )}

      {!visibleTemplate && (
        <div className="mt-6 p-3 bg-gray-800/30 border border-gray-700/50 rounded text-center">
          <p className="text-gray-500 text-sm">No lower third currently showing</p>
        </div>
      )}
    </div>
  )
}
