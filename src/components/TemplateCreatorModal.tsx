import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateShowTemplate, QUICK_TEMPLATES, GeneratedTemplate } from '@/lib/ai/TemplateGenerator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Sparkles, Layout, Pencil, Save, Zap } from 'lucide-react'

interface TemplateCreatorModalProps {
  isOpen: boolean
  onClose: () => void
  onTemplateCreated?: () => void
}

type CreationMethod = 'choose' | 'quick' | 'ai-input' | 'ai-preview' | 'manual'

export function TemplateCreatorModal({ isOpen, onClose, onTemplateCreated }: TemplateCreatorModalProps) {
  const [step, setStep] = useState<CreationMethod>('choose')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null)

  const [aiInput, setAiInput] = useState({
    showType: '',
    showTopic: '',
    targetDuration: 60
  })

  const handleQuickTemplate = (templateKey: string) => {
    const template = QUICK_TEMPLATES[templateKey]
    if (template) {
      setGeneratedTemplate(template)
      setStep('ai-preview')
    }
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try {
      const template = await generateShowTemplate(
        aiInput.showType,
        aiInput.showTopic,
        aiInput.targetDuration
      )
      setGeneratedTemplate(template)
      setStep('ai-preview')
    } catch (err) {
      console.error('Failed to generate template:', err)
      alert('Failed to generate template. Check console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!generatedTemplate) return

    setIsSaving(true)
    try {
      // Create template show
      const { data: show, error: showError } = await supabase
        .from('shows')
        .insert({
          name: generatedTemplate.name,
          description: generatedTemplate.description,
          slug: generatedTemplate.name.toLowerCase().replace(/ /g, '-') + '-template-' + Date.now(),
          is_template: true,
          primary_color: '#3b82f6',
          secondary_color: '#8b5cf6'
        })
        .select()
        .single()

      if (showError) throw showError

      // Create segments
      const segments = generatedTemplate.segments.map((seg, idx) => ({
        show_id: show.id,
        name: seg.name,
        topic: seg.topic,
        question: seg.question,
        position: idx
      }))

      const { error: segmentError } = await supabase
        .from('show_segments')
        .insert(segments)

      if (segmentError) throw segmentError

      // Create questions if available
      if (generatedTemplate.questions && generatedTemplate.questions.length > 0) {
        const questions = generatedTemplate.questions.map((q, idx) => ({
          show_id: show.id,
          question_text: q.text,
          topic: q.topic,
          position: idx
        }))

        const { error: questionError } = await supabase
          .from('show_questions')
          .insert(questions)

        if (questionError) throw questionError
      }

      alert('Template saved successfully!')

      if (onTemplateCreated) {
        onTemplateCreated()
      }

      // Reset and close
      setGeneratedTemplate(null)
      setStep('choose')
      setAiInput({ showType: '', showTopic: '', targetDuration: 60 })
      onClose()

    } catch (err) {
      console.error('Failed to save template:', err)
      alert('Failed to save template. Check console for details.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetModal = () => {
    setStep('choose')
    setGeneratedTemplate(null)
    setAiInput({ showType: '', showTopic: '', targetDuration: 60 })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="bg-gray-900 border-2 border-purple-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <Layout className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Create Show Template</h2>
          </div>
          <button
            onClick={() => {
              resetModal()
              onClose()
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Choose Method */}
          {step === 'choose' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">How would you like to create your template?</h3>
                <p className="text-sm text-gray-400">Choose a method to get started</p>
              </div>

              {/* Quick Start */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-sm font-medium text-gray-300">Quick Start (Pre-built)</h4>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start text-left"
                    onClick={() => handleQuickTemplate('tech-talk')}
                  >
                    <span className="font-semibold">Tech Talk</span>
                    <span className="text-xs text-gray-400">News + Deep Dive</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start text-left"
                    onClick={() => handleQuickTemplate('interview')}
                  >
                    <span className="font-semibold">Interview</span>
                    <span className="text-xs text-gray-400">1-on-1 Format</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start text-left"
                    onClick={() => handleQuickTemplate('educational')}
                  >
                    <span className="font-semibold">Educational</span>
                    <span className="text-xs text-gray-400">Tutorial Format</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start text-left"
                    onClick={() => handleQuickTemplate('gaming')}
                  >
                    <span className="font-semibold">Gaming</span>
                    <span className="text-xs text-gray-400">Live Gameplay</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start text-left"
                    onClick={() => handleQuickTemplate('news-roundup')}
                  >
                    <span className="font-semibold">News Roundup</span>
                    <span className="text-xs text-gray-400">Current Events</span>
                  </Button>
                </div>
              </div>

              {/* AI Generator */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-medium text-gray-300">AI Generator (Custom)</h4>
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                  onClick={() => setStep('ai-input')}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI Producer
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Describe your show and AI will create a custom template
                </p>
              </div>

              {/* Manual */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pencil className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-medium text-gray-300">Manual Creation</h4>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('manual')}
                >
                  Create From Scratch
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Build your own template segment by segment
                </p>
              </div>
            </div>
          )}

          {/* Step 2: AI Input */}
          {step === 'ai-input' && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setStep('choose')} className="mb-4">
                ← Back
              </Button>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Show Type *
                </label>
                <Input
                  placeholder="e.g., Tech Talk, Interview, Educational Workshop, Gaming Stream"
                  value={aiInput.showType}
                  onChange={(e) => setAiInput({ ...aiInput, showType: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Main Topic/Focus *
                </label>
                <Textarea
                  placeholder="e.g., AI and Machine Learning for developers, Indie game development, Personal finance tips"
                  value={aiInput.showTopic}
                  onChange={(e) => setAiInput({ ...aiInput, showTopic: e.target.value })}
                  rows={3}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={aiInput.targetDuration}
                  onChange={(e) => setAiInput({ ...aiInput, targetDuration: parseInt(e.target.value) || 60 })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiInput.showType || !aiInput.showTopic}
              >
                {isGenerating ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Generating Template...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Template
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Preview Generated Template */}
          {step === 'ai-preview' && generatedTemplate && (
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => setStep('choose')} className="mb-4">
                ← Back
              </Button>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{generatedTemplate.name}</h3>
                <p className="text-gray-400">{generatedTemplate.description}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span>{generatedTemplate.segments.length} segments</span>
                  <span>•</span>
                  <span>{generatedTemplate.recommendedDuration} minutes</span>
                  {generatedTemplate.questions && (
                    <>
                      <span>•</span>
                      <span>{generatedTemplate.questions.length} questions</span>
                    </>
                  )}
                </div>
              </div>

              {/* Segments */}
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-400" />
                  Segments ({generatedTemplate.segments.length})
                </h4>
                <div className="space-y-2">
                  {generatedTemplate.segments.map((seg, idx) => (
                    <div key={idx} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-white">{seg.name}</div>
                          <div className="text-sm text-gray-400 mt-1">{seg.topic}</div>
                          <div className="text-xs text-gray-500 italic mt-1">"{seg.question}"</div>
                        </div>
                        <div className="text-sm text-purple-400 font-medium">{seg.estimatedMinutes}m</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions */}
              {generatedTemplate.questions && generatedTemplate.questions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">
                    Question Bank ({generatedTemplate.questions.length})
                  </h4>
                  <div className="bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {generatedTemplate.questions.map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-500">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-white">{q.text}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">
                                {q.category}
                              </span>
                              {q.topic && (
                                <span className="text-xs text-gray-500">{q.topic}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
                <Button variant="outline" onClick={() => setStep('choose')}>
                  Start Over
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Manual Creation (Future Enhancement) */}
          {step === 'manual' && (
            <div className="text-center py-12">
              <Pencil className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Manual template creation coming soon!</p>
              <p className="text-sm text-gray-500 mb-6">
                For now, use Quick Start or AI Generator,<br />
                then edit the template in the Show Manager.
              </p>
              <Button onClick={() => setStep('choose')}>
                Back to Options
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
