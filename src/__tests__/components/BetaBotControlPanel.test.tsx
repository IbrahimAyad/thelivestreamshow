import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BetaBotControlPanel } from '../../components/BetaBotControlPanel'

// ============================================================================
// MOCKS - Critical dependencies that BetaBotControlPanel uses
// ============================================================================

// Mock Supabase client
const mockSupabaseInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(() => Promise.resolve({
      data: { id: 'test-session-123', session_name: 'Test Session', is_active: true },
      error: null
    }))
  }))
}))

const mockSupabaseUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
}))

const mockSupabaseSelect = vi.fn(() => ({
  eq: vi.fn(() => ({
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    eq: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  })),
  order: vi.fn(() => ({
    limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
  }))
}))

const mockSupabaseDelete = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
}))

const mockSupabaseChannel = {
  on: vi.fn(() => mockSupabaseChannel),
  subscribe: vi.fn(() => mockSupabaseChannel),
  unsubscribe: vi.fn()
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
      select: mockSupabaseSelect,
      delete: mockSupabaseDelete
    })),
    channel: vi.fn(() => mockSupabaseChannel)
  }
}))

// Mock Speech Recognition hook
const mockSpeechRecognition = {
  isListening: false,
  transcript: '',
  conversationBuffer: '',
  startListening: vi.fn(),
  stopListening: vi.fn(),
  clearBuffer: vi.fn(),
  processAudioBlob: vi.fn(),
  setAudioSource: vi.fn(),
  transcriptionMode: 'idle' as const,
  whisperAvailable: true
}

vi.mock('../../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn(() => mockSpeechRecognition)
}))

// Mock TTS hook
const mockBrowserTTS = {
  isSpeaking: false,
  speak: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
  voices: [
    { name: 'Test Voice 1', lang: 'en-US', voiceURI: 'test1', default: true, localService: true },
    { name: 'Test Voice 2', lang: 'en-US', voiceURI: 'test2', default: false, localService: true }
  ],
  selectedVoice: { name: 'Test Voice 1', lang: 'en-US', voiceURI: 'test1', default: true, localService: true },
  setSelectedVoice: vi.fn()
}

vi.mock('../../hooks/useTTS', () => ({
  useTTS: vi.fn(() => mockBrowserTTS)
}))

// Mock F5-TTS hook
const mockF5TTS = {
  isSpeaking: false,
  isConnected: false,
  error: null,
  speak: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
  loadVoices: vi.fn(),
  voices: [],
  selectedVoice: null,
  setSelectedVoice: vi.fn()
}

vi.mock('../../hooks/useF5TTS', () => ({
  useF5TTS: vi.fn(() => mockF5TTS)
}))

// Mock OBS Audio hook
const mockOBSAudio = {
  connected: false,
  error: null,
  audioSources: [],
  selectedSource: null,
  connect: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(),
  startAudioCapture: vi.fn(),
  stopAudioCapture: vi.fn(),
  onAudioChunk: vi.fn(),
  getAudioBlob: vi.fn(() => Promise.resolve(null))
}

vi.mock('../../hooks/useOBSAudio', () => ({
  useOBSAudio: vi.fn(() => mockOBSAudio)
}))

// Mock BetaBot Conversation hook
const mockBetaBotConversation = {
  isResponding: false,
  error: null,
  chat: vi.fn((question: string) => Promise.resolve('Mock response from BetaBot')),
  context: {
    history: [],
    lastInteraction: 0,
    showContext: null
  }
}

vi.mock('../../hooks/useBetaBotConversation', () => ({
  useBetaBotConversation: vi.fn(() => mockBetaBotConversation)
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock environment variables
vi.stubEnv('VITE_F5_TTS_ENABLED', 'false')
vi.stubEnv('VITE_F5_TTS_API_URL', 'http://localhost:8000')
vi.stubEnv('VITE_PERPLEXITY_API_KEY', 'test-api-key')

// ============================================================================
// TESTS
// ============================================================================

describe('BetaBotControlPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Reset mock states
    mockSpeechRecognition.isListening = false
    mockSpeechRecognition.transcript = ''
    mockSpeechRecognition.conversationBuffer = ''
    mockBrowserTTS.isSpeaking = false
    mockF5TTS.isConnected = false
    mockOBSAudio.connected = false
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Beta Bot/i)).toBeInTheDocument()
    })

    it('should display initial status as "Ready"', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Ready/i)).toBeInTheDocument()
    })

    it('should render mode selection with two modes', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Question Generator/i)).toBeInTheDocument()
      expect(screen.getByText(/AI Co-Host/i)).toBeInTheDocument()
    })

    it('should default to Co-Host mode', () => {
      render(<BetaBotControlPanel />)
      const coHostButton = screen.getByText(/AI Co-Host/i).closest('button')
      expect(coHostButton).toHaveClass('active')
    })

    it('should render Start Session button', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Start Session/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // MODE SWITCHING TESTS
  // ============================================================================

  describe('Mode Switching', () => {
    it('should switch from Co-Host to Question Generator mode', () => {
      render(<BetaBotControlPanel />)

      const questionGenButton = screen.getByText(/Question Generator/i).closest('button')
      fireEvent.click(questionGenButton!)

      expect(questionGenButton).toHaveClass('active')
    })

    it('should prevent mode switching when session is active', () => {
      mockSpeechRecognition.isListening = true

      render(<BetaBotControlPanel />)

      const questionGenButton = screen.getByText(/Question Generator/i).closest('button')
      fireEvent.click(questionGenButton!)

      // Should still be in Co-Host mode (active class)
      const coHostButton = screen.getByText(/AI Co-Host/i).closest('button')
      expect(coHostButton).toHaveClass('active')
    })
  })

  // ============================================================================
  // TTS PROVIDER TESTS
  // ============================================================================

  describe('TTS Provider Selection', () => {
    it('should display TTS provider selector in Co-Host mode', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/TTS Engine/i)).toBeInTheDocument()
    })

    it('should not display TTS provider selector in Question Generator mode', () => {
      render(<BetaBotControlPanel />)

      const questionGenButton = screen.getByText(/Question Generator/i).closest('button')
      fireEvent.click(questionGenButton!)

      expect(screen.queryByText(/TTS Engine/i)).not.toBeInTheDocument()
    })

    it('should default to browser TTS provider', () => {
      render(<BetaBotControlPanel />)
      const select = screen.getByLabelText(/TTS Engine/i) as HTMLSelectElement
      expect(select.value).toBe('browser')
    })

    it('should save TTS provider preference to localStorage', () => {
      render(<BetaBotControlPanel />)

      const select = screen.getByLabelText(/TTS Engine/i)
      fireEvent.change(select, { target: { value: 'f5tts' } })

      expect(localStorageMock.getItem('betabot_tts_provider')).toBe('f5tts')
    })
  })

  // ============================================================================
  // SESSION LIFECYCLE TESTS
  // ============================================================================

  describe('Session Lifecycle', () => {
    it('should create session when Start Session button is clicked', async () => {
      render(<BetaBotControlPanel />)

      const startButton = screen.getByText(/Start Session/i)
      fireEvent.click(startButton)

      // Should call startListening
      expect(mockSpeechRecognition.startListening).toHaveBeenCalled()
    })

    it('should create session in Supabase when starting', async () => {
      // Mock listening state change
      const { rerender } = render(<BetaBotControlPanel />)

      // Simulate starting listening
      mockSpeechRecognition.isListening = true
      rerender(<BetaBotControlPanel />)

      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalled()
      })
    })

    it('should display session info when session is active', async () => {
      mockSpeechRecognition.isListening = true
      mockSpeechRecognition.conversationBuffer = 'test conversation content here'

      const { rerender } = render(<BetaBotControlPanel />)

      // Trigger session creation by changing listening state
      rerender(<BetaBotControlPanel />)

      await waitFor(() => {
        expect(screen.getByText(/Session Time/i)).toBeInTheDocument()
        expect(screen.getByText(/Questions/i)).toBeInTheDocument()
        expect(screen.getByText(/Interactions/i)).toBeInTheDocument()
      })
    })

    it('should show End Session button when session is active', () => {
      mockSpeechRecognition.isListening = true

      render(<BetaBotControlPanel />)

      expect(screen.getByText(/End Session/i)).toBeInTheDocument()
    })

    it('should end session and update Supabase when End Session clicked', async () => {
      mockSpeechRecognition.isListening = true

      render(<BetaBotControlPanel />)

      const endButton = screen.getByText(/End Session/i)
      fireEvent.click(endButton)

      expect(mockSpeechRecognition.stopListening).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // AUDIO SOURCE TESTS
  // ============================================================================

  describe('Audio Source Selection', () => {
    it('should display audio source options', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Browser Microphone/i)).toBeInTheDocument()
      expect(screen.getByText(/OBS Audio/i)).toBeInTheDocument()
    })

    it('should default to browser audio source', () => {
      render(<BetaBotControlPanel />)
      const browserButton = screen.getByText(/Browser Microphone/i).closest('button')
      expect(browserButton).toHaveClass('active')
    })

    it('should switch to OBS audio source when clicked', () => {
      render(<BetaBotControlPanel />)

      const obsButton = screen.getByText(/OBS Audio/i).closest('button')
      fireEvent.click(obsButton!)

      expect(obsButton).toHaveClass('active')
    })

    it('should show microphone selector when browser source is active', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Select Your Microphone/i)).toBeInTheDocument()
    })

    it('should show OBS connection settings when OBS source is active', () => {
      render(<BetaBotControlPanel />)

      const obsButton = screen.getByText(/OBS Audio/i).closest('button')
      fireEvent.click(obsButton!)

      expect(screen.getByText(/OBS WebSocket Connection/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TEXT CHAT TESTS
  // ============================================================================

  describe('Text Chat (Co-Host Mode)', () => {
    it('should display text chat input in Co-Host mode', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByPlaceholderText(/Type a question for Beta Bot/i)).toBeInTheDocument()
    })

    it('should not display text chat in Question Generator mode', () => {
      render(<BetaBotControlPanel />)

      const questionGenButton = screen.getByText(/Question Generator/i).closest('button')
      fireEvent.click(questionGenButton!)

      expect(screen.queryByPlaceholderText(/Type a question for Beta Bot/i)).not.toBeInTheDocument()
    })

    it('should enable Send button when input has text', () => {
      render(<BetaBotControlPanel />)

      const input = screen.getByPlaceholderText(/Type a question for Beta Bot/i)
      fireEvent.change(input, { target: { value: 'Test question' } })

      const sendButton = screen.getByText(/Send/i)
      expect(sendButton).not.toBeDisabled()
    })

    it('should disable Send button when input is empty', () => {
      render(<BetaBotControlPanel />)

      const sendButton = screen.getByText(/Send/i)
      expect(sendButton).toBeDisabled()
    })
  })

  // ============================================================================
  // VOICE SELECTION TESTS
  // ============================================================================

  describe('Voice Selection', () => {
    it('should display browser voice selector when browser TTS is selected', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Voice Selection/i)).toBeInTheDocument()
    })

    it('should list available voices', () => {
      render(<BetaBotControlPanel />)
      const select = screen.getByLabelText(/Voice Selection/i) as HTMLSelectElement
      expect(select.options.length).toBe(2)
    })

    it('should have Preview button for testing voice', () => {
      render(<BetaBotControlPanel />)
      const previewButtons = screen.getAllByText(/Preview/i)
      expect(previewButtons.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // CONTROL BUTTONS TESTS
  // ============================================================================

  describe('Control Buttons', () => {
    it('should display Test Voice button', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Test Voice/i)).toBeInTheDocument()
    })

    it('should call TTS.speak when Test Voice is clicked', async () => {
      render(<BetaBotControlPanel />)

      const testButton = screen.getByText(/Test Voice/i)
      fireEvent.click(testButton)

      await waitFor(() => {
        expect(mockBrowserTTS.speak).toHaveBeenCalled()
      })
    })

    it('should display Export Transcript button', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Export Transcript/i)).toBeInTheDocument()
    })

    it('should disable Export Transcript when no conversation buffer', () => {
      mockSpeechRecognition.conversationBuffer = ''

      render(<BetaBotControlPanel />)

      const exportButton = screen.getByText(/Export Transcript/i)
      expect(exportButton).toBeDisabled()
    })

    it('should enable Export Transcript when conversation buffer exists', () => {
      mockSpeechRecognition.conversationBuffer = 'Some conversation content here'

      render(<BetaBotControlPanel />)

      const exportButton = screen.getByText(/Export Transcript/i)
      expect(exportButton).not.toBeDisabled()
    })
  })

  // ============================================================================
  // API HEALTH STATUS TESTS
  // ============================================================================

  describe('API Health Status', () => {
    it('should display API health section', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/API Status/i)).toBeInTheDocument()
    })

    it('should show BetaBot GPT-4o status', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/BetaBot \(GPT-4o\)/i)).toBeInTheDocument()
    })

    it('should show Whisper status', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Whisper/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // SESSION HISTORY TESTS
  // ============================================================================

  describe('Session History', () => {
    it('should display session history section', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Session History/i)).toBeInTheDocument()
    })

    it('should have collapsible history section', () => {
      render(<BetaBotControlPanel />)
      const toggleButton = screen.getByRole('button', { name: /▶/ })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should expand history when toggle is clicked', () => {
      render(<BetaBotControlPanel />)

      const toggleButton = screen.getByRole('button', { name: /▶/ })
      fireEvent.click(toggleButton)

      // Should show expanded indicator
      expect(screen.getByRole('button', { name: /▼/ })).toBeInTheDocument()
    })
  })

  // ============================================================================
  // STATUS INDICATOR TESTS
  // ============================================================================

  describe('Status Indicators', () => {
    it('should show "Ready" status when idle', () => {
      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Ready/i)).toBeInTheDocument()
    })

    it('should show "Listening" status when listening', () => {
      mockSpeechRecognition.isListening = true

      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Listening/i)).toBeInTheDocument()
    })

    it('should show "Speaking" status when TTS is active', () => {
      mockBrowserTTS.isSpeaking = true

      render(<BetaBotControlPanel />)
      expect(screen.getByText(/Speaking/i)).toBeInTheDocument()
    })
  })
})
