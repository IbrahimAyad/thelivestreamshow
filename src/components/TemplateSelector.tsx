import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Layout, Play, RefreshCw, Plus, Trash2 } from 'lucide-react'

interface ShowTemplate {
  id: string
  name: string
  description: string
  primary_color: string
  secondary_color: string
  slug: string
}

interface TemplateSelectorProps {
  onTemplateLoaded?: (templateId: string) => void
  onCreateTemplate?: () => void
}

export function TemplateSelector({ onTemplateLoaded, onCreateTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ShowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('id, name, description, primary_color, secondary_color, slug')
        .eq('is_template', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Delete template "${templateName}"? This will also delete all associated segments and questions.`)) {
      return
    }

    setDeletingId(templateId)
    try {
      // Delete the template show (CASCADE will handle segments/questions)
      const { error } = await supabase
        .from('shows')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      alert('Template deleted successfully!')
      loadTemplates()
    } catch (err) {
      console.error('Failed to delete template:', err)
      alert('Failed to delete template. See console for details.')
    } finally {
      setDeletingId(null)
    }
  }

  const loadTemplate = async (templateId: string) => {
    setLoadingTemplateId(templateId)
    try {
      // Clone template to new show instance
      const { data, error } = await supabase.rpc('clone_template_to_show', {
        p_template_id: templateId,
        p_new_show_name: `Show ${new Date().toLocaleDateString()}`,
        p_episode_number: 1,
        p_episode_title: 'Episode 1'
      })

      if (error) {
        console.error('Error from function:', error)
        alert('Failed to load template: ' + error.message)
        return
      }

      const newShowId = data

      console.log('Template cloned to new show:', newShowId)

      // Load segments into UI
      const { data: segments, error: segError } = await supabase
        .from('show_segments')
        .select('*')
        .eq('show_id', newShowId)
        .order('position')

      if (segError) throw segError

      // Load questions into UI
      const { data: questions, error: qError } = await supabase
        .from('show_questions')
        .select('*')
        .eq('show_id', newShowId)
        .order('position')

      if (qError) throw qError

      console.log('Loaded:', {
        segments: segments?.length || 0,
        questions: questions?.length || 0
      })

      alert(`Template loaded! ${segments?.length || 0} segments and ${questions?.length || 0} questions ready.`)

      if (onTemplateLoaded) {
        onTemplateLoaded(newShowId)
      }

      // Refresh page to show new content
      window.location.reload()

    } catch (err) {
      console.error('Failed to load template:', err)
      alert('Failed to load template. See console for details.')
    } finally {
      setLoadingTemplateId(null)
    }
  }

  return (
    <div className="bg-gray-800 border-2 border-blue-600 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layout className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Show Templates</h2>
          </div>
          <div className="flex gap-2">
            {onCreateTemplate && (
              <Button onClick={onCreateTemplate} className="bg-purple-600 hover:bg-purple-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            )}
            <Button onClick={loadTemplates} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Load a pre-configured show template with segments and questions
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Layout className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No templates available</p>
            <p className="text-sm text-gray-500 mt-2">
              Create a template in Show Manager
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-blue-500"
              >
                {/* Template Header with Color */}
                <div
                  className="h-2 rounded-t mb-3"
                  style={{
                    background: `linear-gradient(90deg, ${template.primary_color || '#3b82f6'}, ${template.secondary_color || '#8b5cf6'})`
                  }}
                ></div>

                <h3 className="font-semibold text-white mb-2 line-clamp-1">
                  {template.name}
                </h3>

                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {template.description || 'No description'}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => loadTemplate(template.id)}
                    disabled={loadingTemplateId === template.id || deletingId === template.id}
                  >
                    {loadingTemplateId === template.id ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Load
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTemplate(template.id, template.name)
                    }}
                    disabled={deletingId === template.id || loadingTemplateId === template.id}
                  >
                    {deletingId === template.id ? (
                      <span className="inline-block w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
