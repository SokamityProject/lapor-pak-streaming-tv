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
    <header className="flex items-center justify-between py-2.5 mb-6 bg-[#080B11] border-b border-white/10">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand text-slate-950 font-black text-xs flex items-center justify-center shadow">
          LP
        </div>
        <span className="text-sm md:text-base font-black tracking-tight text-white">
          LAPOR PAK! TV
        </span>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-2">
        <div
          ref={homeFocus.ref}
          onClick={() => onSelectTab('home')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors duration-100 cursor-pointer ${
            homeFocus.isFocused
              ? 'bg-brand text-slate-950 ring-2 ring-white'
              : activeTab === 'home'
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Beranda
        </div>

        <div
          ref={playlistFocus.ref}
          onClick={() => onSelectTab('playlist')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors duration-100 cursor-pointer ${
            playlistFocus.isFocused
              ? 'bg-brand text-slate-950 ring-2 ring-white'
              : activeTab === 'playlist'
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Playlist
        </div>

        <div
          ref={historyFocus.ref}
          onClick={() => onSelectTab('history')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors duration-100 cursor-pointer ${
            historyFocus.isFocused
              ? 'bg-brand text-slate-950 ring-2 ring-white'
              : activeTab === 'history'
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Riwayat
        </div>
      </nav>

      {/* Minimal Status Dot */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">TRANS7</span>
      </div>
    </header>
  );
};
