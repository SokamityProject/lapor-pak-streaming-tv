import React from 'react';
import { useTvFocus } from '../hooks/useTvFocus';

export interface TvNavbarProps {
  activeTab: 'home' | 'playlist' | 'history';
  onSelectTab: (tab: 'home' | 'playlist' | 'history') => void;
}

export const TvNavbar: React.FC<TvNavbarProps> = ({ activeTab, onSelectTab }) => {
  const homeFocus = useTvFocus({ id: 'nav-home', onSelect: () => onSelectTab('home') });
  const playlistFocus = useTvFocus({ id: 'nav-playlist', onSelect: () => onSelectTab('playlist') });
  const historyFocus = useTvFocus({ id: 'nav-history', onSelect: () => onSelectTab('history') });

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between py-2.5 mb-5 border-b border-white/[0.08] bg-[#080B11]/90 backdrop-blur-md">
      {/* Brand Identity - Compact & Clean */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
          LP
        </div>
        <span className="text-sm md:text-base font-black tracking-tight text-white">
          LAPOR PAK! TV
        </span>
      </div>

      {/* Navigation Pills - Compact & Intuitive */}
      <nav className="flex items-center gap-2">
        <div
          ref={homeFocus.ref}
          onClick={() => onSelectTab('home')}
          className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
            homeFocus.isFocused
              ? 'bg-amber-500 text-slate-950 font-black shadow-tv-focus scale-105 ring-2 ring-white/80'
              : activeTab === 'home'
              ? 'bg-white/10 text-white font-bold border border-white/15'
              : 'text-zinc-400 hover:text-white font-medium'
          }`}
        >
          Beranda
        </div>

        <div
          ref={playlistFocus.ref}
          onClick={() => onSelectTab('playlist')}
          className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
            playlistFocus.isFocused
              ? 'bg-amber-500 text-slate-950 font-black shadow-tv-focus scale-105 ring-2 ring-white/80'
              : activeTab === 'playlist'
              ? 'bg-white/10 text-white font-bold border border-white/15'
              : 'text-zinc-400 hover:text-white font-medium'
          }`}
        >
          Playlist
        </div>

        <div
          ref={historyFocus.ref}
          onClick={() => onSelectTab('history')}
          className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
            historyFocus.isFocused
              ? 'bg-amber-500 text-slate-950 font-black shadow-tv-focus scale-105 ring-2 ring-white/80'
              : activeTab === 'history'
              ? 'bg-white/10 text-white font-bold border border-white/15'
              : 'text-zinc-400 hover:text-white font-medium'
          }`}
        >
          Riwayat
        </div>
      </nav>

      {/* Subtle Right Status - Minimal visual weight */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">TRANS7</span>
      </div>
    </header>
  );
};
