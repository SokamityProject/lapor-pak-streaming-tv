import React from 'react';
import { useTvFocus } from '../hooks/useTvFocus';
import { Radio, Film, History } from 'lucide-react';

export interface TvNavbarProps {
  activeTab: 'home' | 'playlist' | 'history';
  onSelectTab: (tab: 'home' | 'playlist' | 'history') => void;
}

export const TvNavbar: React.FC<TvNavbarProps> = ({ activeTab, onSelectTab }) => {
  const homeFocus = useTvFocus({ id: 'nav-home', onSelect: () => onSelectTab('home') });
  const playlistFocus = useTvFocus({ id: 'nav-playlist', onSelect: () => onSelectTab('playlist') });
  const historyFocus = useTvFocus({ id: 'nav-history', onSelect: () => onSelectTab('history') });

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between pb-6 mb-8 border-b border-white/[0.08] backdrop-blur-md">
      {/* Brand Identity aligned with Web Project */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/20">
          LP
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-black tracking-tight text-white">
              LAPOR <span className="text-amber-500">PAK!</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              LAPOR PAK! TV
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium tracking-wide">
            Command Streaming Station • TRANS7
          </p>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="flex items-center gap-3">
        <div
          ref={homeFocus.ref}
          onClick={() => onSelectTab('home')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
            homeFocus.isFocused
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-tv-focus scale-105 ring-2 ring-white/80'
              : activeTab === 'home'
              ? 'bg-white/10 text-white font-bold border border-white/15'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Beranda</span>
        </div>

        <div
          ref={playlistFocus.ref}
          onClick={() => onSelectTab('playlist')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
            playlistFocus.isFocused
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-tv-focus scale-105 ring-2 ring-white/80'
              : activeTab === 'playlist'
              ? 'bg-white/10 text-white font-bold border border-white/15'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Playlist</span>
        </div>

        <div
          ref={historyFocus.ref}
          onClick={() => onSelectTab('history')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
            historyFocus.isFocused
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-tv-focus scale-105 ring-2 ring-white/80'
              : activeTab === 'history'
              ? 'bg-white/10 text-white font-bold border border-white/15'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat</span>
        </div>
      </nav>

      {/* Remote Navigation Guide on TV */}
      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Hub Aktif</span>
        </div>
        <span className="text-zinc-600">|</span>
        <div className="flex items-center gap-3 text-zinc-300 text-[11px]">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-200 font-mono">D-Pad</kbd> Arah</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-200 font-mono">OK</kbd> Pilih</span>
        </div>
      </div>
    </header>
  );
};
