import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WatchVideoDetails } from '../types/api';
import { saveProgress, fetchWatchDetails } from '../services/api';
import { Play, Pause, RotateCcw, RotateCw, ArrowLeft, Shield, RefreshCw, AlertTriangle, Volume2, Volume1 } from 'lucide-react';
import { useTvFocus } from '../hooks/useTvFocus';
import { SpatialNavigation } from '../services/navigation';
import { AudioMode, getAudioMode, toggleAudioMode, initAudioMode } from '../services/audioMode';

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

  // Toggle Audio Mode (Voice Focus) via D-pad Up, ArrowUp, or 'A' key
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
  const [audioMode, setAudioModeState] = useState<AudioMode>(getAudioMode());

  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSeekRef = useRef<number | null>(video.resume_time > 0 ? video.resume_time : null);
  const showOsdRef = useRef(showOsd);
  showOsdRef.current = showOsd;

  useEffect(() => {
    initAudioMode();
  }, []);

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

  const handleToggleAudioMode = useCallback(() => {
    const next = toggleAudioMode();
    setAudioModeState(next);
    showHud(next === 'voice_focus' ? 'FOKUS SUARA: AKTIF 🗣️' : 'AUDIO: STANDAR 🔊');
    resetOsdTimer();
  }, [showHud, resetOsdTimer]);

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
      // If error screen is shown, handle Back key to exit player
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
        onToggleAudioMode: handleToggleAudioMode,
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

  return (
    <div className="fixed inset-0 z-50 bg-[#070A0F] flex items-center justify-center overflow-hidden">
      {hasPlaybackError ? (
        <div className="flex flex-col items-center justify-center p-10 max-w-lg text-center z-50 bg-[#0C111A]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-500 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Tautan Video Kedaluwarsa</h2>
          <p className="text-zinc-400 text-xs sm:text-sm mb-8 leading-relaxed">
            Tautan streaming Facebook memiliki batas waktu keamanan berkala. Tekan tombol di bawah untuk menyegarkan tautan secara otomatis.
          </p>

          <div className="flex items-center gap-4">
            <button
              ref={retryBtnFocus.ref}
              onClick={refreshStreamUrl}
              disabled={isRefreshingLink}
              className={`flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-black text-sm transition-all duration-150 cursor-pointer ${
                retryBtnFocus.isFocused
                  ? 'bg-amber-500 text-slate-950 scale-108 shadow-tv-focus ring-4 ring-white/60'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingLink ? 'animate-spin' : ''}`} />
              <span>{isRefreshingLink ? 'Menyegarkan Tautan...' : 'Segarkan Tautan (OK)'}</span>
            </button>

            <button
              ref={exitBtnFocus.ref}
              onClick={onClose}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer ${
                exitBtnFocus.isFocused
                  ? 'bg-white/20 text-white scale-108 ring-2 ring-white shadow-tv-focus'
                  : 'bg-white/10 text-zinc-300 hover:bg-white/15 border border-white/10'
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

          {/* Center HUD Feedback matching YouTube Web polish */}
          {hudMessage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-[#0C111A]/90 backdrop-blur-2xl border border-white/15 text-amber-400 px-8 py-5 rounded-3xl flex items-center gap-4 text-2xl font-black shadow-2xl animate-fade-in">
                {hudMessage === 'PLAY' ? (
                  <Play className="w-8 h-8 fill-current" />
                ) : hudMessage === 'PAUSE' ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : hudMessage.startsWith('+') ? (
                  <RotateCw className="w-8 h-8 text-amber-400" />
                ) : hudMessage.startsWith('-') ? (
                  <RotateCcw className="w-8 h-8 text-amber-400" />
                ) : (
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                )}
                <span>{hudMessage}</span>
              </div>
            </div>
          )}

          {/* On-Screen Display (OSD) Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/80 flex flex-col justify-between p-10 md:p-14 transition-opacity duration-300 pointer-events-none ${
              showOsd ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center backdrop-blur-xl shadow-lg cursor-pointer pointer-events-auto"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded shadow-sm">
                      EPS. {video.episode}
                    </span>
                    <span className="text-zinc-400 text-xs font-semibold">
                      Lapor Pak! Command Streaming Station
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight drop-shadow">
                    {video.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleAudioMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer pointer-events-auto ${
                    audioMode === 'voice_focus'
                      ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                      : 'bg-white/10 border border-white/15 text-zinc-300 hover:text-white backdrop-blur-md'
                  }`}
                >
                  {audioMode === 'voice_focus' ? (
                    <>
                      <Volume2 className="w-4 h-4 text-slate-950" />
                      <span>Fokus Suara: AKTIF [▲]</span>
                    </>
                  ) : (
                    <>
                      <Volume1 className="w-4 h-4 text-zinc-400" />
                      <span>Audio: STANDAR [▲]</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 px-4 py-2 rounded-xl text-xs font-bold text-zinc-200 backdrop-blur-md shadow-sm">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>
                    {isPlaying ? 'Sedang Diputar' : 'Dijeda'} • {currentSrc === video.hd ? 'HD 1080p' : 'SD 720p'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Playback Bar */}
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-xs">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(245,158,11,0.9)]"
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="font-mono text-sm text-zinc-200">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Remote Guide Help with stylish kbd badges */}
                <div className="flex items-center gap-5 text-xs text-zinc-300 font-semibold">
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-200 font-mono text-[11px]">OK</kbd> Putar / Jeda
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-200 font-mono text-[11px]">◀ / ▶</kbd> Lompat 10s
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-200 font-mono text-[11px]">▲</kbd> Fokus Suara
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-200 font-mono text-[11px]">KEMBALI</kbd> Keluar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
