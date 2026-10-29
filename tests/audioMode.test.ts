import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAudioMode, setAudioMode, toggleAudioMode, initAudioMode, _resetAudioModeState } from '../src/services/audioMode';

describe('TV Audio Mode Service (Voice Focus / Clear Dialogue)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).TvAppBridge;
    _resetAudioModeState();
  });

  it('defaults to standard audio mode if no saved preference', () => {
    expect(getAudioMode()).toBe('standard');
  });

  it('persists and retrieves voice_focus mode from localStorage', () => {
    setAudioMode('voice_focus');
    expect(getAudioMode()).toBe('voice_focus');
    expect(localStorage.getItem('laporpak_tv_audio_mode')).toBe('voice_focus');
  });

  it('toggles between standard and voice_focus', () => {
    expect(getAudioMode()).toBe('standard');
    const first = toggleAudioMode();
    expect(first).toBe('voice_focus');
    expect(getAudioMode()).toBe('voice_focus');

    const second = toggleAudioMode();
    expect(second).toBe('standard');
    expect(getAudioMode()).toBe('standard');
  });

  it('calls native TvAppBridge.setVoiceFocus when TvAppBridge is available', () => {
    const mockSetVoiceFocus = vi.fn();
    (window as any).TvAppBridge = {
      setVoiceFocus: mockSetVoiceFocus,
    };

    setAudioMode('voice_focus');
    expect(mockSetVoiceFocus).toHaveBeenCalledWith(true);

    setAudioMode('standard');
    expect(mockSetVoiceFocus).toHaveBeenCalledWith(false);
  });

  it('initializes audio mode on app load from stored preference', () => {
    const mockSetVoiceFocus = vi.fn();
    (window as any).TvAppBridge = {
      setVoiceFocus: mockSetVoiceFocus,
    };

    localStorage.setItem('laporpak_tv_audio_mode', 'voice_focus');
    initAudioMode();
    expect(mockSetVoiceFocus).toHaveBeenCalledWith(true);
  });
});
