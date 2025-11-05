/**
 * Stream Audio Controller
 * Dummy/stub file for overlays that reference it
 * Real audio control happens through the main dashboard
 */

class StreamAudioController {
  constructor() {
    console.log('[StreamAudioController] Initialized (stub)');
  }

  // Stub methods for compatibility
  playSound(soundId) {
    console.log('[StreamAudioController] playSound called:', soundId);
  }

  stopAllSounds() {
    console.log('[StreamAudioController] stopAllSounds called');
  }

  setVolume(volume) {
    console.log('[StreamAudioController] setVolume called:', volume);
  }
}

// Make it globally available for overlay HTML files
if (typeof window !== 'undefined') {
  window.StreamAudioController = StreamAudioController;
}
