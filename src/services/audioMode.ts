export type AudioMode = 'standard' | 'voice_focus';

const AUDIO_MODE_KEY = 'laporpak_tv_audio_mode';

let currentAudioMode: AudioMode | null = null;

/**
 * Get current audio mode ('standard' | 'voice_focus').
 */
export function getAudioMode(): AudioMode {
  if (currentAudioMode !== null) return currentAudioMode;

  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(AUDIO_MODE_KEY);
      if (saved === 'voice_focus' || saved === 'standard') {
        currentAudioMode = saved;
        return currentAudioMode;
      }
    }
  } catch (e) {
    console.warn('Failed to read audio mode preference:', e);
  }

  currentAudioMode = 'standard';
  return currentAudioMode;
}

/**
 * Set and persist audio mode, notifying native Android DSP bridge if present.
 */
export function setAudioMode(mode: AudioMode): AudioMode {
  currentAudioMode = mode;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUDIO_MODE_KEY, mode);
    }
  } catch (e) {
    console.warn('Failed to persist audio mode preference:', e);
  }

  // Communicate with Android native AudioFX Equalizer via JavascriptInterface
  try {
    if (typeof window !== 'undefined' && (window as any).TvAppBridge?.setVoiceFocus) {
      (window as any).TvAppBridge.setVoiceFocus(mode === 'voice_focus');
    }
  } catch (e) {
    console.warn('Failed to communicate with TvAppBridge audio DSP:', e);
  }

  return mode;
}

/**
 * Toggle between 'standard' and 'voice_focus'.
 */
export function toggleAudioMode(): AudioMode {
  const next: AudioMode = getAudioMode() === 'voice_focus' ? 'standard' : 'voice_focus';
  return setAudioMode(next);
}

/**
 * Initialize audio mode on app load from stored preference.
 */
export function initAudioMode(): AudioMode {
  currentAudioMode = null;
  const mode = getAudioMode();
  return setAudioMode(mode);
}

/**
 * Reset in-memory cache (for testing).
 */
export function _resetAudioModeState(): void {
  currentAudioMode = null;
}
