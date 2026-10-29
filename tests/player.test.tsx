import { describe, it, expect, vi } from 'vitest';
import { handlePlayerRemoteKey } from '../src/components/TvPlayer';

describe('TV Player Remote Controls', () => {
  it('toggles play/pause on Enter/OK key', () => {
    const onTogglePlay = vi.fn();
    handlePlayerRemoteKey({ key: 'Enter' }, { onTogglePlay, onSeek: vi.fn(), onBack: vi.fn() });
    expect(onTogglePlay).toHaveBeenCalled();
  });

  it('triggers -10s seek on ArrowLeft and +10s seek on ArrowRight', () => {
    const onSeek = vi.fn();
    handlePlayerRemoteKey({ key: 'ArrowLeft' }, { onTogglePlay: vi.fn(), onSeek, onBack: vi.fn() });
    expect(onSeek).toHaveBeenCalledWith(-10);

    handlePlayerRemoteKey({ key: 'ArrowRight' }, { onTogglePlay: vi.fn(), onSeek, onBack: vi.fn() });
    expect(onSeek).toHaveBeenCalledWith(10);
  });

  it('exits player on Back/Escape key', () => {
    const onBack = vi.fn();
    handlePlayerRemoteKey({ key: 'Escape' }, { onTogglePlay: vi.fn(), onSeek: vi.fn(), onBack });
    expect(onBack).toHaveBeenCalled();
  });
});
