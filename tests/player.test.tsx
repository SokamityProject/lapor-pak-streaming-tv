import { describe, it, expect, vi } from 'vitest';
import { handlePlayerRemoteKey, PlayerCallbacks } from '../src/components/TvPlayer';

describe('TV Player Remote Controls & Overlay Behavior', () => {
  const createCallbacks = (): PlayerCallbacks & {
    onCenterClick: ReturnType<typeof vi.fn>;
    onTogglePlay: ReturnType<typeof vi.fn>;
    onSeek: ReturnType<typeof vi.fn>;
    onBack: ReturnType<typeof vi.fn>;
  } => ({
    onCenterClick: vi.fn(),
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
    onBack: vi.fn(),
  });

  it('triggers onCenterClick on D-pad Enter, Space, and Select keys', () => {
    const callbacks = createCallbacks();

    handlePlayerRemoteKey({ key: 'Enter' }, callbacks);
    expect(callbacks.onCenterClick).toHaveBeenCalledTimes(1);

    handlePlayerRemoteKey({ key: ' ' }, callbacks);
    expect(callbacks.onCenterClick).toHaveBeenCalledTimes(2);

    handlePlayerRemoteKey({ key: 'Select' }, callbacks);
    expect(callbacks.onCenterClick).toHaveBeenCalledTimes(3);

    // Should NOT directly toggle play on center click
    expect(callbacks.onTogglePlay).not.toHaveBeenCalled();
  });

  it('triggers onTogglePlay on dedicated MediaPlayPause key', () => {
    const callbacks = createCallbacks();
    handlePlayerRemoteKey({ key: 'MediaPlayPause' }, callbacks);
    expect(callbacks.onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('triggers -10s seek on ArrowLeft and +10s seek on ArrowRight', () => {
    const callbacks = createCallbacks();
    handlePlayerRemoteKey({ key: 'ArrowLeft' }, callbacks);
    expect(callbacks.onSeek).toHaveBeenCalledWith(-10);

    handlePlayerRemoteKey({ key: 'ArrowRight' }, callbacks);
    expect(callbacks.onSeek).toHaveBeenCalledWith(10);
  });

  it('exits player on Back, Escape, Backspace, GoBack, and Android KEYCODE_BACK (code 4)', () => {
    const callbacks = createCallbacks();

    handlePlayerRemoteKey({ key: 'Escape' }, callbacks);
    expect(callbacks.onBack).toHaveBeenCalledTimes(1);

    handlePlayerRemoteKey({ key: 'Backspace' }, callbacks);
    expect(callbacks.onBack).toHaveBeenCalledTimes(2);

    handlePlayerRemoteKey({ key: 'GoBack' }, callbacks);
    expect(callbacks.onBack).toHaveBeenCalledTimes(3);

    handlePlayerRemoteKey({ key: 'Back' }, callbacks);
    expect(callbacks.onBack).toHaveBeenCalledTimes(4);

    handlePlayerRemoteKey({ key: 'Unidentified', keyCode: 4 } as any, callbacks);
    expect(callbacks.onBack).toHaveBeenCalledTimes(5);
  });
});
