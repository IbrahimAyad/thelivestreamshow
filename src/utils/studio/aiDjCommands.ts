/**
 * AI DJ Command Interface
 * Allows AI to control all DJ features via text commands
 */

export interface DJCommandContext {
  // Phase 1 Features
  filterChain: {
    setHPF: (frequency: number) => void
    setLPF: (frequency: number) => void
    reset: () => void
  }
  audioPlayer: {
    tempo: number
    isKeyLockEnabled: boolean
    gain: number
    volume: number
    setTempoRate: (rate: number) => void
    toggleKeyLock: () => void
    changeGain: (gain: number) => void
    changeVolume: (volume: number) => void
    setLimiterThreshold: (threshold: number) => void
    setLimiterRatio: (ratio: number) => void
    play: () => void
    pause: () => void
    stop: () => void
  }
  // Phase 2 Features
  quantize: {
    enabled: boolean
    snapToGrid: string
    toggle: () => void
    changeGrid: (grid: any) => void
  }
  // Dual Deck System
  dualDeck?: {
    deckA: {
      play: () => void
      pause: () => void
      cue: () => void
      setTempoRate: (rate: number) => void
      setEQ: (band: 'low' | 'mid' | 'high', gain: number) => void
      killEQ: (band: 'low' | 'mid' | 'high') => void
      resetEQ: () => void
      setChannelFaderLevel: (level: number) => void
      loadTrack: (track: any) => void
      getDeckState: () => any
    }
    deckB: {
      play: () => void
      pause: () => void
      cue: () => void
      setTempoRate: (rate: number) => void
      setEQ: (band: 'low' | 'mid' | 'high', gain: number) => void
      killEQ: (band: 'low' | 'mid' | 'high') => void
      resetEQ: () => void
      setChannelFaderLevel: (level: number) => void
      loadTrack: (track: any) => void
      getDeckState: () => any
    }
    mixer: {
      setCrossfaderPosition: (position: number) => void
      setCrossfaderCurve: (curve: 'linear' | 'smooth' | 'fast-cut') => void
      setMasterVolume: (volume: number) => void
      crossfaderToA: () => void
      crossfaderToCenter: () => void
      crossfaderToB: () => void
    }
    controls: {
      syncDecks: (sourceDeck: 'A' | 'B') => void
      areDecksSynced: () => boolean
      areDecksInKey: () => boolean
    }
  }
}

export interface DJCommand {
  command: string
  description: string
  examples: string[]
  execute: (context: DJCommandContext, params?: any) => Promise<string>
}

/**
 * Registry of all AI-accessible DJ commands
 */
export const DJ_COMMANDS: Record<string, DJCommand> = {
  // ===== FILTER COMMANDS =====
  'filter:hpf': {
    command: 'filter:hpf',
    description: 'Set high-pass filter frequency (cuts bass)',
    examples: [
      'Set HPF to 100Hz',
      'Cut bass below 500Hz',
      'Enable high pass filter at 200Hz'
    ],
    execute: async (context, params) => {
      const freq = params?.frequency || 20
      context.filterChain.setHPF(freq)
      return `High-pass filter set to ${freq}Hz (cutting bass below this frequency)`
    }
  },

  'filter:lpf': {
    command: 'filter:lpf',
    description: 'Set low-pass filter frequency (cuts treble)',
    examples: [
      'Set LPF to 5000Hz',
      'Cut treble above 2kHz',
      'Enable low pass filter at 10kHz'
    ],
    execute: async (context, params) => {
      const freq = params?.frequency || 20000
      context.filterChain.setLPF(freq)
      return `Low-pass filter set to ${freq}Hz (cutting treble above this frequency)`
    }
  },

  'filter:reset': {
    command: 'filter:reset',
    description: 'Reset all filters to neutral',
    examples: [
      'Reset filters',
      'Clear all filters',
      'Disable filters'
    ],
    execute: async (context) => {
      context.filterChain.reset()
      return 'All filters reset to neutral (full frequency range)'
    }
  },

  // ===== TEMPO & KEY LOCK COMMANDS =====
  'tempo:set': {
    command: 'tempo:set',
    description: 'Set playback tempo (50% to 200%)',
    examples: [
      'Set tempo to 110%',
      'Speed up to 120%',
      'Slow down to 90%'
    ],
    execute: async (context, params) => {
      const percentage = params?.percentage || 100
      const rate = percentage / 100
      context.audioPlayer.setTempoRate(rate)
      return `Tempo set to ${percentage}% (${rate.toFixed(2)}x speed)`
    }
  },

  'tempo:reset': {
    command: 'tempo:reset',
    description: 'Reset tempo to 100%',
    examples: [
      'Reset tempo',
      'Normal speed',
      'Original tempo'
    ],
    execute: async (context) => {
      context.audioPlayer.setTempoRate(1.0)
      return 'Tempo reset to 100% (original speed)'
    }
  },

  'keylock:toggle': {
    command: 'keylock:toggle',
    description: 'Toggle key lock (master tempo) on/off',
    examples: [
      'Enable key lock',
      'Turn on master tempo',
      'Disable key lock'
    ],
    execute: async (context) => {
      context.audioPlayer.toggleKeyLock()
      const state = context.audioPlayer.isKeyLockEnabled
      return `Key lock ${state ? 'ENABLED' : 'DISABLED'} - pitch ${state ? 'will stay constant' : 'will change with tempo'}`
    }
  },

  // ===== GAIN & VOLUME COMMANDS =====
  'gain:set': {
    command: 'gain:set',
    description: 'Set pre-fader gain (0% to 150%)',
    examples: [
      'Set gain to 70%',
      'Increase gain to 100%',
      'Boost gain to 120%'
    ],
    execute: async (context, params) => {
      const percentage = params?.percentage || 70
      const gain = percentage / 100
      context.audioPlayer.changeGain(gain)
      return `Gain set to ${percentage}% (${gain.toFixed(2)})`
    }
  },

  'volume:set': {
    command: 'volume:set',
    description: 'Set output volume (0% to 100%)',
    examples: [
      'Set volume to 70%',
      'Volume to 50%',
      'Full volume'
    ],
    execute: async (context, params) => {
      const percentage = params?.percentage || 70
      const volume = percentage / 100
      context.audioPlayer.changeVolume(volume)
      return `Volume set to ${percentage}%`
    }
  },

  // ===== LIMITER COMMANDS =====
  'limiter:threshold': {
    command: 'limiter:threshold',
    description: 'Set master limiter threshold (-20dB to 0dB)',
    examples: [
      'Set limiter threshold to -3dB',
      'Limiter at -6dB',
      'Threshold -1dB'
    ],
    execute: async (context, params) => {
      const threshold = params?.threshold || -1
      context.audioPlayer.setLimiterThreshold(threshold)
      return `Master limiter threshold set to ${threshold}dB`
    }
  },

  'limiter:ratio': {
    command: 'limiter:ratio',
    description: 'Set master limiter ratio (1:1 to 20:1)',
    examples: [
      'Set limiter ratio to 12:1',
      'Hard limiting at 20:1',
      'Soft limiting at 4:1'
    ],
    execute: async (context, params) => {
      const ratio = params?.ratio || 20
      context.audioPlayer.setLimiterRatio(ratio)
      return `Master limiter ratio set to ${ratio}:1`
    }
  },

  // ===== QUANTIZE COMMANDS =====
  'quantize:enable': {
    command: 'quantize:enable',
    description: 'Enable quantization (beat snapping)',
    examples: [
      'Enable quantize',
      'Turn on beat snap',
      'Activate quantization'
    ],
    execute: async (context) => {
      if (!context.quantize.enabled) {
        context.quantize.toggle()
      }
      return `Quantize ENABLED - cues and loops will snap to ${context.quantize.snapToGrid} grid`
    }
  },

  'quantize:disable': {
    command: 'quantize:disable',
    description: 'Disable quantization',
    examples: [
      'Disable quantize',
      'Turn off beat snap',
      'Deactivate quantization'
    ],
    execute: async (context) => {
      if (context.quantize.enabled) {
        context.quantize.toggle()
      }
      return 'Quantize DISABLED - cues and loops will be placed at exact positions'
    }
  },

  'quantize:grid': {
    command: 'quantize:grid',
    description: 'Set quantize grid resolution',
    examples: [
      'Set quantize to 1/4',
      'Snap to 1/8 notes',
      'Grid resolution 1/16'
    ],
    execute: async (context, params) => {
      const grid = params?.grid || '1/4'
      context.quantize.changeGrid(grid)
      return `Quantize grid set to ${grid} notes`
    }
  },

  // ===== PLAYBACK COMMANDS =====
  'playback:play': {
    command: 'playback:play',
    description: 'Start playback',
    examples: ['Play', 'Start', 'Resume playback'],
    execute: async (context) => {
      await context.audioPlayer.play()
      return 'Playback started'
    }
  },

  'playback:pause': {
    command: 'playback:pause',
    description: 'Pause playback',
    examples: ['Pause', 'Stop playing', 'Pause track'],
    execute: async (context) => {
      context.audioPlayer.pause()
      return 'Playback paused'
    }
  },

  'playback:stop': {
    command: 'playback:stop',
    description: 'Stop playback and reset',
    examples: ['Stop', 'Stop playback', 'Reset track'],
    execute: async (context) => {
      context.audioPlayer.stop()
      return 'Playback stopped and reset to beginning'
    }
  },

  // ===== DUAL DECK COMMANDS =====
  'deck:play': {
    command: 'deck:play',
    description: 'Play specific deck (A or B)',
    examples: ['Play deck A', 'Start deck B', 'Play on deck A'],
    execute: async (context, params) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      const deck = params?.deck?.toUpperCase() || 'A'
      if (deck === 'A') {
        context.dualDeck.deckA.play()
        return 'Deck A playing'
      } else {
        context.dualDeck.deckB.play()
        return 'Deck B playing'
      }
    }
  },

  'deck:pause': {
    command: 'deck:pause',
    description: 'Pause specific deck (A or B)',
    examples: ['Pause deck A', 'Stop deck B', 'Pause on deck A'],
    execute: async (context, params) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      const deck = params?.deck?.toUpperCase() || 'A'
      if (deck === 'A') {
        context.dualDeck.deckA.pause()
        return 'Deck A paused'
      } else {
        context.dualDeck.deckB.pause()
        return 'Deck B paused'
      }
    }
  },

  'deck:sync': {
    command: 'deck:sync',
    description: 'Sync deck tempos (BPM matching)',
    examples: ['Sync decks', 'Match BPM deck A to B', 'Sync deck B to A'],
    execute: async (context, params) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      const sourceDeck = params?.deck?.toUpperCase() || 'B'
      context.dualDeck.controls.syncDecks(sourceDeck as 'A' | 'B')
      return `Decks synced - matched tempo to Deck ${sourceDeck}`
    }
  },

  'crossfader:position': {
    command: 'crossfader:position',
    description: 'Set crossfader position (0=A, 0.5=center, 1=B)',
    examples: ['Crossfader to A', 'Center crossfader', 'Crossfader to B', 'Crossfader at 70%'],
    execute: async (context, params) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      const position = params?.position ?? 0.5
      context.dualDeck.mixer.setCrossfaderPosition(position)
      const desc = position < 0.3 ? 'Full A' : position > 0.7 ? 'Full B' : 'Center'
      return `Crossfader set to ${(position * 100).toFixed(0)}% (${desc})`
    }
  },

  'crossfader:a': {
    command: 'crossfader:a',
    description: 'Crossfader full to Deck A',
    examples: ['Crossfader to A', 'Full A', 'Switch to deck A'],
    execute: async (context) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      context.dualDeck.mixer.crossfaderToA()
      return 'Crossfader → Full A'
    }
  },

  'crossfader:center': {
    command: 'crossfader:center',
    description: 'Crossfader to center (50/50 mix)',
    examples: ['Center crossfader', 'Crossfader middle', '50/50 mix'],
    execute: async (context) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      context.dualDeck.mixer.crossfaderToCenter()
      return 'Crossfader → Center (50/50 mix)'
    }
  },

  'crossfader:b': {
    command: 'crossfader:b',
    description: 'Crossfader full to Deck B',
    examples: ['Crossfader to B', 'Full B', 'Switch to deck B'],
    execute: async (context) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      context.dualDeck.mixer.crossfaderToB()
      return 'Crossfader → Full B'
    }
  },

  'deck:eq': {
    command: 'deck:eq',
    description: 'Adjust EQ for specific deck',
    examples: ['Boost bass on deck A', 'Cut mids on deck B', 'EQ high +10 deck A'],
    execute: async (context, params) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      const deck = params?.deck?.toUpperCase() || 'A'
      const band = params?.band || 'mid'
      const gain = params?.gain || 0

      if (deck === 'A') {
        context.dualDeck.deckA.setEQ(band, gain)
      } else {
        context.dualDeck.deckB.setEQ(band, gain)
      }
      return `Deck ${deck} ${band} EQ set to ${gain > 0 ? '+' : ''}${gain}dB`
    }
  },

  'deck:master-volume': {
    command: 'deck:master-volume',
    description: 'Set master output volume (0-1)',
    examples: ['Master volume 80%', 'Set master to 100%', 'Master output 70%'],
    execute: async (context, params) => {
      if (!context.dualDeck) return 'Dual deck system not available'
      const percentage = params?.percentage || 80
      const volume = percentage / 100
      context.dualDeck.mixer.setMasterVolume(volume)
      return `Master volume set to ${percentage}%`
    }
  },
}

/**
 * Parse natural language to DJ command
 */
export function parseNaturalLanguageToDJCommand(input: string): {
  command: string | null
  params: any
} {
  const lowerInput = input.toLowerCase()

  // Filter commands
  if (lowerInput.includes('hpf') || lowerInput.includes('high pass') || lowerInput.includes('cut bass')) {
    const freqMatch = lowerInput.match(/(\d+)\s*(hz|khz)?/)
    const frequency = freqMatch ? parseInt(freqMatch[1]) * (freqMatch[2] === 'khz' ? 1000 : 1) : 20
    return { command: 'filter:hpf', params: { frequency } }
  }

  if (lowerInput.includes('lpf') || lowerInput.includes('low pass') || lowerInput.includes('cut treble')) {
    const freqMatch = lowerInput.match(/(\d+)\s*(hz|khz)?/)
    const frequency = freqMatch ? parseInt(freqMatch[1]) * (freqMatch[2] === 'khz' ? 1000 : 1) : 20000
    return { command: 'filter:lpf', params: { frequency } }
  }

  if (lowerInput.includes('reset filter') || lowerInput.includes('clear filter')) {
    return { command: 'filter:reset', params: {} }
  }

  // Tempo commands
  if (lowerInput.includes('tempo') || lowerInput.includes('speed')) {
    if (lowerInput.includes('reset') || lowerInput.includes('normal')) {
      return { command: 'tempo:reset', params: {} }
    }
    const percentMatch = lowerInput.match(/(\d+)%/)
    const percentage = percentMatch ? parseInt(percentMatch[1]) : 100
    return { command: 'tempo:set', params: { percentage } }
  }

  // Key lock
  if (lowerInput.includes('key lock') || lowerInput.includes('master tempo')) {
    return { command: 'keylock:toggle', params: {} }
  }

  // Gain
  if (lowerInput.includes('gain')) {
    const percentMatch = lowerInput.match(/(\d+)%/)
    const percentage = percentMatch ? parseInt(percentMatch[1]) : 70
    return { command: 'gain:set', params: { percentage } }
  }

  // Volume
  if (lowerInput.includes('volume')) {
    const percentMatch = lowerInput.match(/(\d+)%/)
    const percentage = percentMatch ? parseInt(percentMatch[1]) : 70
    return { command: 'volume:set', params: { percentage } }
  }

  // Quantize
  if (lowerInput.includes('quantize') || lowerInput.includes('beat snap')) {
    if (lowerInput.includes('enable') || lowerInput.includes('on')) {
      return { command: 'quantize:enable', params: {} }
    }
    if (lowerInput.includes('disable') || lowerInput.includes('off')) {
      return { command: 'quantize:disable', params: {} }
    }
    const gridMatch = lowerInput.match(/1\/(32|16|8|4|2)|(\d+)\s*bar/)
    if (gridMatch) {
      const grid = gridMatch[0].includes('bar') ? gridMatch[2] : `1/${gridMatch[1]}`
      return { command: 'quantize:grid', params: { grid } }
    }
  }

  // Dual Deck Commands
  if (lowerInput.includes('deck a') || lowerInput.includes('deck b')) {
    const deck = lowerInput.includes('deck a') ? 'A' : 'B'

    if (lowerInput.includes('play') || lowerInput.includes('start')) {
      return { command: 'deck:play', params: { deck } }
    }
    if (lowerInput.includes('pause') || lowerInput.includes('stop')) {
      return { command: 'deck:pause', params: { deck } }
    }
    if (lowerInput.includes('eq') || lowerInput.includes('bass') || lowerInput.includes('mid') || lowerInput.includes('high')) {
      const band = lowerInput.includes('bass') || lowerInput.includes('low') ? 'low' :
                   lowerInput.includes('mid') || lowerInput.includes('middle') ? 'mid' : 'high'
      const gainMatch = lowerInput.match(/([-+]?\d+)\s*(db)?/)
      const gain = gainMatch ? parseInt(gainMatch[1]) : 0
      return { command: 'deck:eq', params: { deck, band, gain } }
    }
  }

  // Crossfader Commands
  if (lowerInput.includes('crossfader') || lowerInput.includes('cross fader')) {
    if (lowerInput.includes('deck a') || lowerInput.includes('full a') || lowerInput.match(/\b(to )?a\b/)) {
      return { command: 'crossfader:a', params: {} }
    }
    if (lowerInput.includes('deck b') || lowerInput.includes('full b') || lowerInput.match(/\b(to )?b\b/)) {
      return { command: 'crossfader:b', params: {} }
    }
    if (lowerInput.includes('center') || lowerInput.includes('middle') || lowerInput.includes('50')) {
      return { command: 'crossfader:center', params: {} }
    }
    const percentMatch = lowerInput.match(/(\d+)%/)
    if (percentMatch) {
      const percentage = parseInt(percentMatch[1])
      return { command: 'crossfader:position', params: { position: percentage / 100 } }
    }
  }

  // Deck Sync
  if (lowerInput.includes('sync') && (lowerInput.includes('deck') || lowerInput.includes('bpm'))) {
    const deck = lowerInput.includes('deck a') ? 'A' : 'B'
    return { command: 'deck:sync', params: { deck } }
  }

  // Master Volume (dual deck)
  if (lowerInput.includes('master') && lowerInput.includes('volume')) {
    const percentMatch = lowerInput.match(/(\d+)%/)
    const percentage = percentMatch ? parseInt(percentMatch[1]) : 80
    return { command: 'deck:master-volume', params: { percentage } }
  }

  // Playback
  if (lowerInput.includes('play') && !lowerInput.includes('pause')) {
    return { command: 'playback:play', params: {} }
  }
  if (lowerInput.includes('pause')) {
    return { command: 'playback:pause', params: {} }
  }
  if (lowerInput.includes('stop')) {
    return { command: 'playback:stop', params: {} }
  }

  return { command: null, params: {} }
}

/**
 * Execute DJ command from AI
 */
export async function executeDJCommand(
  commandName: string,
  context: DJCommandContext,
  params?: any
): Promise<string> {
  const command = DJ_COMMANDS[commandName]
  if (!command) {
    return `Unknown command: ${commandName}. Available commands: ${Object.keys(DJ_COMMANDS).join(', ')}`
  }

  try {
    return await command.execute(context, params)
  } catch (error) {
    return `Error executing ${commandName}: ${error}`
  }
}

/**
 * Get all available DJ commands for AI reference
 */
export function getAvailableDJCommands(): string {
  return Object.values(DJ_COMMANDS)
    .map(cmd => `- ${cmd.command}: ${cmd.description}`)
    .join('\n')
}
