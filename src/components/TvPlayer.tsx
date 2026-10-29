import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WatchVideoDetails } from '../types/api';
import { saveProgress } from '../services/api';
import { Play, Pause, RotateCcw, RotateCw, ArrowLeft, Shield } from 'lucide-react';

export interface PlayerCallbacks {
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onBack: () => void;
}

export function handlePlayerRemoteKey(
  event: { key: string },
  callbacks: PlayerCallbacks
): boolean {
  switch (event.key) {
    case 'Enter':
    case ' ':
    case 'MediaPlayPause':
      callbacks.onTogglePlay();
      return true;
    case 'ArrowLeft':
    case 'MediaRewind':
      callbacks.onSeek(-10);
      return true;
    case 'ArrowRight':
    case 'MediaFastForward':
      callbacks.onSeek(10);
      return true;
    case 'Escape':
    case 'Backspace':
    case 'GoBack':
      callbacks.onBack();
      return true;
    default:
      return false;
  }
}

export interface TvPlayerProps {
  video: WatchVideoDetails;
  onClose: () => void;
}

export const TvPlayer: React.FC<TvPlayerProps> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(video.hd || video.sd);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showOsd, setShowOsd] = useState(true);
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetOsdTimer = useCallback(() => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false);
    }, 3500);
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
        videoRef.current.play();
        setIsPlaying(true);
        showHud('PLAY');
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        showHud('PAUSE');
      }
    }
    resetOsdTimer();
  }, [resetOsdTimer, showHud]);

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
          videoRef.current.currentTime >= (videoRef.current.duration || 0) * 0.95
        );
      } catch (e) {
        console.error('Failed to save progress on exit:', e);
      }
    }
    onClose();
  }, [video.id, onClose]);

  // Periodic watch progress sync every 25 seconds
  useEffect(() => {
    syncTimerRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress(
          video.id,
          videoRef.current.currentTime,
          videoRef.current.currentTime >= (videoRef.current.duration || 0) * 0.95
        ).catch(() => {});
      }
    }, 25000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [video.id]);

  // Remote keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const handled = handlePlayerRemoteKey(e, {
        onTogglePlay: togglePlay,
        onSeek: seek,
        onBack: handleBack,
      });
      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    resetOsdTimer();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [togglePlay, seek, handleBack, resetOsdTimer]);

  // Set initial resume time
  useEffect(() => {
    if (videoRef.current && video.resume_time > 0) {
      videoRef.current.currentTime = video.resume_time;
      setCurrentTime(video.resume_time);
    }
  }, [video.resume_time]);

  // Video error fallback: from HD to SD
  const handleVideoError = () => {
    if (currentSrc === video.hd && video.sd) {
      showHud('HD Gagal, Beralih ke SD...');
      setCurrentSrc(video.sd);
    } else {
      showHud('Gagal memutar video');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={currentSrc}
        poster={video.thumbnail}
        autoPlay
        playsInline
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
          saveProgress(video.id, duration, true).catch(() => {});
        }}
      />

      {/* Center HUD Feedback (Play, Pause, Seek) */}
      {hudMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700 text-brand px-6 py-4 rounded-2xl flex items-center gap-3 text-xl font-black shadow-2xl animate-fade-in">
            {hudMessage === 'PLAY' ? (
              <Play className="w-8 h-8 fill-current" />
            ) : hudMessage === 'PAUSE' ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : hudMessage.startsWith('+') ? (
              <RotateCw className="w-8 h-8 text-brand" />
            ) : (
              <RotateCcw className="w-8 h-8 text-brand" />
            )}
            <span>{hudMessage}</span>
          </div>
        </div>
      )}

      {/* On-Screen Display (OSD) Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/70 flex flex-col justify-between p-12 transition-opacity duration-300 pointer-events-none ${
          showOsd ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-brand text-slate-950 font-black text-xs px-2 py-0.5 rounded">
                  EPS. {video.episode}
                </span>
                <span className="text-slate-400 text-xs">Lapor Pak! Streaming</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{video.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300">
            <Shield className="w-4 h-4 text-brand" />
            <span>{isPlaying ? 'Sedang Diputar' : 'Dijeda'} • {currentSrc === video.hd ? 'HD 1080p' : 'SD 720p'}</span>
          </div>
        </div>

        {/* Bottom Playback Bar */}
        <div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-brand transition-all duration-150"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>

            {/* Remote Guide Help */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
              <span>OK: Putar / Jeda</span>
              <span>◀ / ▶: Lompat 10s</span>
              <span>KEMBALI: Keluar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
