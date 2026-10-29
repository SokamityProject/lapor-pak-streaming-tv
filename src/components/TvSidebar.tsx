import React, { useState } from 'react';
import { Home, ListVideo, History, LogOut } from 'lucide-react';
import { useTvFocus } from '../hooks/useTvFocus';

export interface TvSidebarProps {
  activeTab: 'home' | 'playlist' | 'history';
  onSelectTab: (tab: 'home' | 'playlist' | 'history') => void;
  onOpenExitModal: () => void;
  className?: string;
  isExpanded?: boolean;
}

export const TvSidebar: React.FC<TvSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenExitModal,
  className = '',
  isExpanded: propExpanded,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const homeFocus = useTvFocus({
    id: 'nav-home',
    onSelect: () => onSelectTab('home'),
  });

  const playlistFocus = useTvFocus({
    id: 'nav-playlist',
    onSelect: () => onSelectTab('playlist'),
  });

  const historyFocus = useTvFocus({
    id: 'nav-history',
    onSelect: () => onSelectTab('history'),
  });

  const exitFocus = useTvFocus({
    id: 'nav-exit',
    onSelect: onOpenExitModal,
  });

  const isAnyFocused =
    homeFocus.isFocused ||
    playlistFocus.isFocused ||
    historyFocus.isFocused ||
    exitFocus.isFocused;

  const isExpanded =
    propExpanded !== undefined ? propExpanded : isHovered || isAnyFocused;

  const navItems = [
    {
      id: 'nav-home' as const,
      tab: 'home' as const,
      label: 'Beranda',
      icon: Home,
      focus: homeFocus,
      onClick: () => onSelectTab('home'),
    },
    {
      id: 'nav-playlist' as const,
      tab: 'playlist' as const,
      label: 'Playlist',
      icon: ListVideo,
      focus: playlistFocus,
      onClick: () => onSelectTab('playlist'),
    },
    {
      id: 'nav-history' as const,
      tab: 'history' as const,
      label: 'Riwayat',
      icon: History,
      focus: historyFocus,
      onClick: () => onSelectTab('history'),
    },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col justify-between bg-[#0B1120] border-r border-white/10 transition-all duration-300 ease-in-out select-none ${
        isExpanded ? 'w-56 shadow-2xl shadow-black/80' : 'w-20'
      } ${className}`}
    >
      {/* Top Section: Brand Badge & Main Navigation */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 overflow-hidden">
          <div className="w-10 h-10 min-w-10 rounded-xl bg-brand text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
            LP
          </div>
          <div
            className={`flex flex-col min-w-0 transition-opacity duration-200 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
              LAPOR PAK! TV
            </span>
            <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
              TRANS7 OTT
            </span>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex flex-col gap-2 p-3 mt-4" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemFocused = item.focus.isFocused;
            const isActive = activeTab === item.tab;

            return (
              <div
                key={item.id}
                ref={item.focus.ref}
                data-testid={item.id}
                onClick={item.onClick}
                className={`flex items-center h-12 px-3 rounded-xl cursor-pointer transition-all duration-150 transform ${
                  isItemFocused
                    ? 'bg-brand text-slate-950 font-bold scale-105 shadow-md'
                    : isActive
                    ? 'bg-white/15 text-white font-semibold border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <Icon
                    className={`w-5 h-5 ${
                      isItemFocused
                        ? 'text-slate-950 stroke-[2.5]'
                        : isActive
                        ? 'text-brand stroke-[2]'
                        : 'text-slate-400 stroke-[2]'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs md:text-sm tracking-wide whitespace-nowrap transition-all duration-200 overflow-hidden ${
                    isExpanded ? 'opacity-100 max-w-xs ml-3' : 'opacity-0 max-w-0 ml-0'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Exit / Keluar */}
      <div className="p-3 border-t border-white/10">
        <div
          ref={exitFocus.ref}
          data-testid="nav-exit"
          onClick={onOpenExitModal}
          className={`flex items-center h-12 px-3 rounded-xl cursor-pointer transition-all duration-150 transform ${
            exitFocus.isFocused
              ? 'bg-brand text-slate-950 font-bold scale-105 shadow-md'
              : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          }`}
        >
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <LogOut
              className={`w-5 h-5 ${
                exitFocus.isFocused
                  ? 'text-slate-950 stroke-[2.5]'
                  : 'text-slate-400 group-hover:text-red-400 stroke-[2]'
              }`}
            />
          </div>
          <span
            className={`text-xs md:text-sm tracking-wide whitespace-nowrap transition-all duration-200 overflow-hidden ${
              isExpanded ? 'opacity-100 max-w-xs ml-3' : 'opacity-0 max-w-0 ml-0'
            }`}
          >
            Keluar
          </span>
        </div>
      </div>
    </aside>
  );
};
