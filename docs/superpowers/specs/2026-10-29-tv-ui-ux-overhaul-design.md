# Lapor Pak TV - 10-Foot OTT UI/UX Redesign Specification

## 1. Intent & Context
The current Android TV application suffered from clunky navigation paradigms borrowed from web design (sticky topbars, coordinate drift, trapping loops, card clipping, and inconsistent D-pad traversal).
This specification completely replaces the web-centric layout with an industry-standard **10-Foot OTT Television Experience** (inspired by modern Android TV OS, Netflix, and Disney+).

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Left Sidebar Navigation Rail (`TvSidebar`)**: Replace the topbar with a slim collapsible/expandable left vertical navigation rail (`[🏠 Beranda]`, `[📑 Playlist]`, `[🕒 Riwayat]`, `[🚪 Keluar]`).
- **Seamless D-pad Traversal**:
  - From any content rail card, pressing `Left` at column 0 moves to the active Sidebar item.
  - From the Sidebar, pressing `Right` enters the first visible content card in the active rail.
  - Pressing `Back` from anywhere in content returns focus to the Sidebar `nav-home`.
  - Pressing `Back` from the Sidebar opens the Exit Confirmation Dialog.
- **Hero Billboard (`TvHeroSpotlight`)**: Cinematic wide featured banner with full-bleed backdrop, metadata chips (`TRANS7`, `HD`, Release Date), punchy synopsis, and high-visibility `[ ▶ Putar Episode ]` CTA.
- **Crisp & Proportional Content Rails (`TvRowRail` & `TvVideoCard`)**:
  - 16:9 cards with fixed 256px (`w-64`) dimensions.
  - 0-lag focus feedback: subtle `scale-105` zoom with a sleek 2px gold border (`#F59E0B`). Zero GPU-heavy blur filters (`backdrop-filter: blur`) or neon halos that cause frame drops on Android TV hardware.
  - Generous vertical rail clearance (no card clipping).
- **Cinema Dark OLED Theme**: Deep blacks (`#050811`), dark slate cards (`#0F172A`), high-contrast white text (`#F8FAFC`), and gold accent (`#F59E0B`).

### Non-Goals
- Touch or mouse-pointer optimizations (the app is strictly built for Android TV D-pad remote controls).
- Re-introducing web-style dense grids or horizontal topbars.

### Anti-Goals
- Trapping navigation loops where `Up` or `Down` gets stuck in a rail.
- Sticky elements that hover over scrolling content.
- Heavy backdrop blurs or multi-stop gradients that drop frame rates on low-power TV chips.

---

## 3. Screen Layout & Component Architecture

### Layout Structure
```
+---------------------------------------------------------------------------------+
| [LP] | HERO BILLBOARD (Spotlight)                                               |
|      | +----------------------------------------------------------------------+ |
| [🏠] | | [TRANS7 HD]  28 Oktober 2026                                         | |
|      | | Kasus Pencurian Bebek Pak RT                                         | |
| [📑] | | Komandan Andre dan Pasukan Lapor Pak menyelidiki...                  | |
|      | | [ ▶ Putar Sekarang ]                                                 | |
| [🕒] | +----------------------------------------------------------------------+ |
|      |                                                                          |
| [🚪] | CONTENT RAILS                                                            |
|      | Lanjutkan Menonton                                                       |
|      | [ Card 1 ]  [ Card 2 ]  [ Card 3 ]  [ Card 4 ] ...                       |
|      |                                                                          |
|      | Episode Bulan Oktober 2026                                               |
|      | [ Card 1 ]  [ Card 2 ]  [ Card 3 ]  [ Card 4 ] ...                       |
+---------------------------------------------------------------------------------+
  ^
  |-- Left Navigation Rail (Collapsed: 72px / Expanded: 220px)
```

---

## 4. Navigation State Machine & D-pad Matrix

| Current Focus State | D-pad Up | D-pad Down | D-pad Left | D-pad Right | D-pad OK | Back Button |
|---|---|---|---|---|---|---|
| **Sidebar: Home (`nav-home`)** | (None / Stay) | `nav-playlist` | (Stay) | Focus Hero CTA (`hero-play-btn`) | Switch to Home tab | Open Exit Modal |
| **Sidebar: Playlist (`nav-playlist`)** | `nav-home` | `nav-history` | (Stay) | Focus 1st playlist card | Switch to Playlist tab | Focus `nav-home` |
| **Sidebar: History (`nav-history`)** | `nav-playlist` | `nav-exit` | (Stay) | Focus 1st history card | Switch to History tab | Focus `nav-home` |
| **Sidebar: Exit (`nav-exit`)** | `nav-history` | (Stay) | (Stay) | Focus content | Open Exit Modal | Focus `nav-home` |
| **Hero CTA (`hero-play-btn`)** | (Stay) | 1st card of Rail 0 | Focus `nav-home` | (Stay) | Play Featured Video | Focus `nav-home` |
| **Rail Card: Col 0 (`rail-X-card-0`)** | Card above in Rail X-1 (or Hero CTA) | Card below in Rail X+1 | Focus Sidebar active tab | Card 1 (`rail-X-card-1`) | Play Video | Focus `nav-home` |
| **Rail Card: Col N (`rail-X-card-N`)** | Card above in Rail X-1 (or Hero CTA) | Card below in Rail X+1 | Card N-1 in same rail | Card N+1 in same rail | Play Video | Focus `nav-home` |
| **Exit Modal Buttons** | (Stay) | (Stay) | Toggle between Cancel & Exit | Toggle between Cancel & Exit | Action (Cancel or Exit) | Dismiss Modal |

---

## 5. Visual Tokens (Cinema Dark OLED)
- **Background Root**: `#060913` (Ultra-deep slate black, 0% eye strain in dark rooms).
- **Sidebar Rail**: `#0B1120` with right border `1px solid rgba(255, 255, 255, 0.08)`.
- **Card Background**: `#0F172A` with border `1.5px solid rgba(255, 255, 255, 0.08)`.
- **Focus Indicator**: `border-amber-400 scale-105 shadow-[0_8px_24px_rgba(245,158,11,0.25)]` (fast, crisp, high contrast).
- **Primary Accent**: Amber Gold `#F59E0B` (`text-amber-400`, `bg-amber-400`).
- **Typography**: Clean high-contrast sans (`font-sans`), bold episode titles (`text-white`), muted subtext (`text-slate-400`).
