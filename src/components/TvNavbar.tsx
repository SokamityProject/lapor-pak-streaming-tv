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
    <header className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
      <div className="flex items-center gap-4">
        <div className="bg-brand text-slate-950 font-black text-sm tracking-wider px-3 py-1.5 rounded-lg shadow-md">
          LAPOR PAK! TV
        </div>
        <span className="text-slate-400 text-xs font-medium tracking-wide">
          Streaming Hub
        </span>
      </div>

      <nav className="flex items-center gap-6">
        <div
          ref={homeFocus.ref}
          onClick={() => onSelectTab('home')}
          className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-all duration-150 cursor-pointer ${
            homeFocus.isFocused
              ? 'bg-brand text-slate-950 shadow-tv-focus scale-105'
              : activeTab === 'home'
              ? 'text-brand border-b-2 border-brand'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Beranda
        </div>

        <div
          ref={playlistFocus.ref}
          onClick={() => onSelectTab('playlist')}
          className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-all duration-150 cursor-pointer ${
            playlistFocus.isFocused
              ? 'bg-brand text-slate-950 shadow-tv-focus scale-105'
              : activeTab === 'playlist'
              ? 'text-brand border-b-2 border-brand'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Playlist
        </div>

        <div
          ref={historyFocus.ref}
          onClick={() => onSelectTab('history')}
          className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-all duration-150 cursor-pointer ${
            historyFocus.isFocused
              ? 'bg-brand text-slate-950 shadow-tv-focus scale-105'
              : activeTab === 'history'
              ? 'text-brand border-b-2 border-brand'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Riwayat
        </div>
      </nav>
    </header>
  );
};
