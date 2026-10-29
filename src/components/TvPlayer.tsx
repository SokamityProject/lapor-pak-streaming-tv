import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WatchVideoDetails } from '../types/api';
import { saveProgress, fetchWatchDetails } from '../services/api';
import { Play, Pause, RotateCcw, RotateCw, ArrowLeft, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTvFocus } from '../hooks/useTvFocus';
import { SpatialNavigation } from '../services/navigation';

export interface PlayerCallbacks {
  onCenterClick: () => void;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onBack: () => void;
  onToggleAudioMode?: () => void;
}

export function handlePlayerRemoteKey(
  event: { key: string; keyCode?: number },
  callbacks: PlayerCallbacks
): boolean {
  const key = event.key;
  const keyCode = event.keyCode;

  // Optional audio mode toggle handler for unit test compatibility
  if (
    key === 'ArrowUp' ||
    key === 'Up' ||
    key === 'a' ||
    key === 'A' ||
    key === 'AudioTrack' ||
    keyCode === 19 ||
    keyCode === 65 ||
    keyCode === 170
  ) {
    if (callbacks.onToggleAudioMode) {
      callbacks.onToggleAudioMode();
      return true;
    }
  }

  // D-pad Center / OK button
  if (
    key === 'Enter' ||
    key === ' ' ||
    key === 'Select' ||
    keyCode === 13 ||
    keyCode === 23
  ) {
    callbacks.onCenterClick();
    return true;
  }

  // Dedicated Play/Pause media keys
  if (
    key === 'MediaPlayPause' ||
    key === 'MediaPlay' ||
    key === 'MediaPause' ||
    keyCode === 85 ||
    keyCode === 126 ||
    keyCode === 127
  ) {
    callbacks.onTogglePlay();
    return true;
  }

  // Left arrow / Rewind
  if (
    key === 'ArrowLeft' ||
    key === 'MediaRewind' ||
    keyCode === 21 ||
    keyCode === 89
  ) {
    callbacks.onSeek(-10);
    return true;
  }

  // Right arrow / Fast Forward
  if (
    key === 'ArrowRight' ||
    key === 'MediaFastForward' ||
    keyCode === 22 ||
    keyCode === 90
  ) {
    callbacks.onSeek(10);
    return true;
  }

  // Back button
  if (
    key === 'Escape' ||
    key === 'Backspace' ||
    key === 'GoBack' ||
    key === 'Back' ||
    keyCode === 4 ||
    keyCode === 27 ||
    keyCode === 8
  ) {
    callbacks.onBack();
    return true;
  }

  return false;
}

export interface TvPlayerProps {
  video: WatchVideoDetails;
  onClose: () => void;
}

export const TvPlayer: React.FC<TvPlayerProps> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(video.hd || video.sd || '');
  const [currentTime, setCurrentTime] = useState(video.resume_time || 0);
  const [duration, setDuration] = useState(0);
  const [showOsd, setShowOsd] = useState(true);
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [isRefreshingLink, setIsRefreshingLink] = useState(false);

  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSeekRef = useRef<number | null>(video.resume_time > 0 ? video.resume_time : null);
  const showOsdRef = useRef(showOsd);
  showOsdRef.current = showOsd;

  const resetOsdTimer = useCallback(() => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false);
    }, 4500);
  }, []);

  const showHud = useCallback((msg: string) => {
    setHudMessage(msg);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setHudMessage(null);
    }, 1500);
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          showHud('PLAY');
        }).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        showHud('PAUSE');
      }
    }
    resetOsdTimer();
  }, [resetOsdTimer, showHud]);

  // Center button behavior: 1st click wakes up controls; 2nd click toggles play/pause
  const handleCenterClick = useCallback(() => {
    if (!showOsdRef.current) {
      resetOsdTimer();
    } else {
      togglePlay();
    }
  }, [resetOsdTimer, togglePlay]);

  const seek = useCallback((delta: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + delta));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      showHud(delta > 0 ? `+${delta}s` : `${delta}s`);
    }
    resetOsdTimer();
  }, [resetOsdTimer, showHud]);

  const handleBack = useCallback(async () => {
    if (videoRef.current) {
      try {
        await saveProgress(
          video.id,
          videoRef.current.currentTime,
          videoRef.current.currentTime >= (videoRef.current.duration || 0) * 0.95,
          video
        );
      } catch (e) {
        console.error('Failed to save local progress on exit:', e);
      }
    }
    onClose();
  }, [video, onClose]);

  // Periodic watch progress sync every 15 seconds to local storage
  useEffect(() => {
    syncTimerRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress(
          video.id,
          videoRef.current.currentTime,
          videoRef.current.currentTime >= (videoRef.current.duration || 0) * 0.95,
          video
        ).catch(() => {});
      }
    }, 15000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [video]);

  // Attempt to refresh Facebook stream URLs if link expired
  const refreshStreamUrl = useCallback(async () => {
    setIsRefreshingLink(true);
    showHud('Menyegarkan tautan Facebook...');
    try {
      const refreshed = await fetchWatchDetails(video.slug, true);
      const newUrl = refreshed.hd || refreshed.sd;
      if (newUrl) {
        setCurrentSrc(newUrl);
        setHasPlaybackError(false);
        showHud('Tautan berhasil diperbarui');
        if (videoRef.current) {
          videoRef.current.src = newUrl;
          videoRef.current.load();
        }
      } else {
        setHasPlaybackError(true);
      }
    } catch (e) {
      console.error('Failed to refresh stream link:', e);
      setHasPlaybackError(true);
    } finally {
      setIsRefreshingLink(false);
    }
  }, [video.slug, showHud]);

  // Video error fallback: try SD if HD fails, otherwise try Facebook API refresh
  const handleVideoError = useCallback(() => {
    if (currentSrc === video.hd && video.sd && video.sd !== video.hd) {
      showHud('HD Gagal, Beralih ke SD...');
      setCurrentSrc(video.sd);
    } else {
      refreshStreamUrl();
    }
  }, [currentSrc, video.hd, video.sd, showHud, refreshStreamUrl]);

  // Remote keyboard listener when player is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasPlaybackError) {
        if (
          e.key === 'Escape' ||
          e.key === 'Backspace' ||
          e.key === 'GoBack' ||
          e.key === 'Back' ||
          (e as any).keyCode === 4
        ) {
          e.preventDefault();
          e.stopPropagation();
          handleBack();
        }
        return;
      }

      const handled = handlePlayerRemoteKey(e, {
        onCenterClick: handleCenterClick,
        onTogglePlay: togglePlay,
        onSeek: seek,
        onBack: handleBack,
      });
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleCustomBack = (e: Event) => {
      e.preventDefault();
      handleBack();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('tvbackbutton', handleCustomBack);
    resetOsdTimer();

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('tvbackbutton', handleCustomBack);
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [handleCenterClick, togglePlay, seek, handleBack, resetOsdTimer, hasPlaybackError]);

  // Error screen focus buttons
  const retryBtnFocus = useTvFocus<HTMLButtonElement>({
    id: 'player-retry-link-btn',
    autoFocus: hasPlaybackError,
    onSelect: refreshStreamUrl,
    groupId: 'player-error-group',
  });

  const exitBtnFocus = useTvFocus<HTMLButtonElement>({
    id: 'player-error-back-btn',
    onSelect: onClose,
    groupId: 'player-error-group',
  });

  useEffect(() => {
    if (hasPlaybackError) {
      SpatialNavigation.setScope('player-error-group');
    } else {
      SpatialNavigation.setScope(null);
    }
  }, [hasPlaybackError]);

  const handleCanPlay = () => {
    if (videoRef.current && pendingSeekRef.current !== null) {
      videoRef.current.currentTime = pendingSeekRef.current;
      pendingSeekRef.current = null;
    }
    videoRef.current?.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn('Autoplay prevented, waiting for user play:', err);
      setIsPlaying(false);
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatPlayerTitle = (title: string) => {
    if (!title) return 'Eps.';
    const trimmed = title.trim();
    if (/^eps\.?/i.test(trimmed)) {
      return trimmed.replace(/^eps\.?\s*/i, 'Eps. ');
    }
    if (/^episode\s*/i.test(trimmed)) {
      return trimmed.replace(/^episode\s*/i, 'Eps. ');
    }
    return `Eps. ${trimmed}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {hasPlaybackError ? (
        <div className="flex flex-col items-center justify-center p-8 max-w-lg text-center z-50 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl">
          <div className="w-14 h-14 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4 text-brand">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Tautan Video Kedaluwarsa</h2>
          <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
            Tautan streaming Facebook memiliki batas waktu keamanan berkala. Tekan tombol di bawah untuk menyegarkan tautan secara otomatis.
          </p>

          <div className="flex items-center gap-3">
            <button
              ref={retryBtnFocus.ref}
              onClick={refreshStreamUrl}
              disabled={isRefreshingLink}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors duration-100 cursor-pointer ${
                retryBtnFocus.isFocused
                  ? 'bg-brand text-slate-950 ring-2 ring-white'
                  : 'bg-brand text-slate-950 hover:bg-amber-400'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingLink ? 'animate-spin' : ''}`} />
              <span>{isRefreshingLink ? 'Menyegarkan...' : 'Segarkan Tautan (OK)'}</span>
            </button>

            <button
              ref={exitBtnFocus.ref}
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors duration-100 cursor-pointer ${
                exitBtnFocus.isFocused
                  ? 'bg-white/20 text-white ring-2 ring-white'
                  : 'bg-white/10 text-zinc-300 border border-white/10'
              }`}
            >
              Kembali
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={currentSrc}
            poster={video.thumbnail}
            autoPlay
            playsInline
            onCanPlay={handleCanPlay}
            onError={handleVideoError}
            className="w-full h-full object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                setDuration(videoRef.current.duration || 0);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              saveProgress(video.id, duration, true, video).catch(() => {});
            }}
          />

          {/* Center HUD Feedback */}
          {hudMessage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-[#0F172A]/90 border border-white/20 text-brand px-6 py-3.5 rounded-2xl flex items-center gap-3 text-xl font-black shadow-2xl">
                {hudMessage === 'PLAY' ? (
                  <Play className="w-6 h-6 fill-current" />
                ) : hudMessage === 'PAUSE' ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : hudMessage.startsWith('+') ? (
                  <RotateCw className="w-6 h-6 text-brand" />
                ) : hudMessage.startsWith('-') ? (
                  <RotateCcw className="w-6 h-6 text-brand" />
                ) : (
                  <RefreshCw className="w-6 h-6 text-brand animate-spin" />
                )}
                <span>{hudMessage}</span>
              </div>
            </div>
          )}

          {/* On-Screen Display (OSD) Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80 flex flex-col justify-between p-8 md:p-10 transition-opacity duration-200 pointer-events-none ${
              showOsd ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center shadow cursor-pointer pointer-events-auto"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-brand text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded shadow tracking-wide">
                      Lapor Pak Streaming
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-white mt-1 tracking-tight">
                    {formatPlayerTitle(video.title)}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-200">
                <Shield className="w-3.5 h-3.5 text-brand" />
                <span>
                  {isPlaying ? 'Sedang Diputar' : 'Dijeda'} • {currentSrc === video.hd ? 'HD 1080p' : 'SD 720p'}
                </span>
              </div>
            </div>

            {/* Bottom Playback Bar */}
            <div className="space-y-2">
              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-150"
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="font-mono text-xs text-zinc-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Remote Guide Help */}
                <div className="flex items-center gap-4 text-xs text-zinc-400 font-semibold">
                  <span>OK: Putar / Jeda</span>
                  <span>◀ / ▶: Lompat 10s</span>
                  <span>KEMBALI: Keluar</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
