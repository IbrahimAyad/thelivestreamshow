import { useState } from 'react'
import { X, Zap, Heart, Star, Crown, Sparkles, DollarSign, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface UltraChatModalProps {
  isOpen: boolean
  onClose: () => void
}

const AMOUNT_TIERS = [
  { amount: 0, label: 'Free', color: 'from-blue-500 to-cyan-500', icon: Zap, description: 'Show your support' },
  { amount: 2, label: '$2', color: 'from-green-500 to-emerald-500', icon: Heart, description: 'Coffee money' },
  { amount: 5, label: '$5', color: 'from-yellow-500 to-amber-500', icon: Star, description: 'Breakfast on us' },
  { amount: 10, label: '$10', color: 'from-orange-500 to-red-500', icon: Sparkles, description: 'Big supporter' },
  { amount: 25, label: '$25', color: 'from-red-500 to-pink-500', icon: Crown, description: 'VIP status' },
  { amount: 50, label: '$50', color: 'from-purple-500 to-fuchsia-500', icon: Crown, description: 'Legendary' },
]

export function UltraChatModal({ isOpen, onClose }: UltraChatModalProps) {
  const [step, setStep] = useState<'compose' | 'payment' | 'success'>('compose')
  const [selectedAmount, setSelectedAmount] = useState(0)
  const [customAmount, setCustomAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedTier = AMOUNT_TIERS.find(t => t.amount === selectedAmount) || AMOUNT_TIERS[0]
  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount
  const charCount = message.length
  const maxChars = 500

  const handleSubmit = async () => {
    if (!senderName.trim() || !message.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (charCount > maxChars) {
      setError(`Message is too long (${charCount}/${maxChars} characters)`)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // If amount > 0, we'd process payment here
      // For now, we'll just save the Ultra Chat
      const { data, error: dbError } = await supabase
        .from('ultra_chats')
        .insert({
          sender_name: senderName.trim(),
          sender_email: senderEmail.trim() || null,
          message: message.trim(),
          amount: finalAmount,
          payment_status: finalAmount > 0 ? 'pending' : 'free',
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Show success
      setStep('success')

      // Reset after 2 seconds
      setTimeout(() => {
        onClose()
        resetForm()
      }, 3000)

    } catch (err) {
      console.error('Ultra Chat error:', err)
      setError('Failed to send Ultra Chat. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep('compose')
    setSelectedAmount(0)
    setCustomAmount('')
    setSenderName('')
    setSenderEmail('')
    setMessage('')
    setError('')
  }

  const handleClose = () => {
    if (step !== 'success') {
      if (message.trim() && !confirm('Discard your Ultra Chat?')) {
        return
      }
    }
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-black border-2 border-cyan-500/30 rounded-xl sm:rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden animate-slideUp max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Send Ultra Chat</h2>
              <p className="text-xs sm:text-sm text-gray-400">Support the show with a message</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-4 sm:p-8">
          {step === 'compose' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Choose Your Support Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {AMOUNT_TIERS.map((tier) => {
                    const Icon = tier.icon
                    return (
                      <button
                        key={tier.amount}
                        onClick={() => {
                          setSelectedAmount(tier.amount)
                          setCustomAmount('')
                        }}
                        className={`
                          relative p-3 sm:p-4 rounded-xl border-2 transition-all
                          ${selectedAmount === tier.amount && !customAmount
                            ? `border-transparent bg-gradient-to-br ${tier.color} shadow-lg scale-105`
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2 mx-auto ${selectedAmount === tier.amount && !customAmount ? 'text-white' : 'text-gray-400'}`} />
                        <div className={`text-base sm:text-lg font-bold ${selectedAmount === tier.amount && !customAmount ? 'text-white' : 'text-gray-300'}`}>
                          {tier.label}
                        </div>
                        <div className={`text-[10px] sm:text-xs ${selectedAmount === tier.amount && !customAmount ? 'text-white/80' : 'text-gray-500'}`}>
                          {tier.description}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Amount */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Or enter custom amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value)
                        setSelectedAmount(0)
                      }}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Sender Info */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={50}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts, feedback, or just say hi..."
                  maxLength={maxChars}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${charCount > maxChars * 0.9 ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {charCount}/{maxChars} characters
                  </span>
                  {finalAmount > 0 && (
                    <span className={`text-sm font-semibold bg-gradient-to-r ${selectedTier.color} bg-clip-text text-transparent`}>
                      ${finalAmount.toFixed(2)} Ultra Chat
                    </span>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !senderName.trim() || !message.trim()}
                className={`
                  w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
                  ${isSubmitting || !senderName.trim() || !message.trim()
                    ? 'bg-gray-700 cursor-not-allowed'
                    : `bg-gradient-to-r ${selectedTier.color} hover:shadow-lg hover:scale-[1.02]`
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {finalAmount > 0 ? `Send Ultra Chat - $${finalAmount.toFixed(2)}` : 'Send Free Ultra Chat'}
                  </>
                )}
              </button>

              {finalAmount > 0 && (
                <p className="text-center text-xs text-gray-500">
                  Payment processing will be available soon. For now, enjoy free Ultra Chats!
                </p>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Ultra Chat Sent!</h3>
              <p className="text-gray-400">
                Thank you for your support! Your message has been sent to the team.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
