import React, { useEffect } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useTvFocus } from '../hooks/useTvFocus';
import { SpatialNavigation } from '../services/navigation';

export interface TvExitModalProps {
  isOpen?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const exitTvApp = (): void => {
  if (typeof window === 'undefined') return;

  if ((window as any).TvAppBridge?.exitApp) {
    (window as any).TvAppBridge.exitApp();
  } else if ((window as any).Capacitor?.Plugins?.App?.exitApp) {
    (window as any).Capacitor.Plugins.App.exitApp();
  } else if ((window as any).navigator?.app?.exitApp) {
    (window as any).navigator.app.exitApp();
  } else {
    window.close();
  }
};

export const TvExitModal: React.FC<TvExitModalProps> = ({
  isOpen = true,
  onConfirm,
  onCancel,
}) => {
  const cancelFocus = useTvFocus<HTMLButtonElement>({
    id: 'exit-cancel-btn',
    autoFocus: true,
    onSelect: onCancel,
    groupId: 'exit-modal',
  });

  const confirmFocus = useTvFocus<HTMLButtonElement>({
    id: 'exit-confirm-btn',
    onSelect: onConfirm,
    groupId: 'exit-modal',
  });

  useEffect(() => {
    if (!isOpen) return;

    SpatialNavigation.setScope('exit-modal');
    SpatialNavigation.setFocus('exit-cancel-btn');

    return () => {
      SpatialNavigation.setScope(null);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 select-none"
    >
      <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4 text-brand">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3
          id="exit-modal-title"
          className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight"
        >
          Keluar dari Aplikasi?
        </h3>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-xs">
          Apakah Anda yakin ingin menutup Lapor Pak! Streaming TV?
        </p>

        <div className="flex items-center gap-4 w-full justify-center">
          <button
            ref={cancelFocus.ref}
            id="exit-cancel-btn"
            data-testid="exit-cancel-btn"
            onClick={onCancel}
            className={`px-8 py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-100 cursor-pointer ${
              cancelFocus.isFocused
                ? 'bg-brand text-slate-950 font-black shadow-tv-focus scale-105 ring-4 ring-white/60'
                : 'bg-white/10 text-zinc-300 hover:bg-white/15 border border-white/10'
            }`}
          >
            Batal
          </button>
          <button
            ref={confirmFocus.ref}
            id="exit-confirm-btn"
            data-testid="exit-confirm-btn"
            onClick={onConfirm}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm md:text-base transition-all duration-100 cursor-pointer ${
              confirmFocus.isFocused
                ? 'bg-red-600 text-white shadow-tv-focus scale-105 ring-4 ring-white/60'
                : 'bg-red-700/80 text-white hover:bg-red-600 border border-red-500/30'
            }`}
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
