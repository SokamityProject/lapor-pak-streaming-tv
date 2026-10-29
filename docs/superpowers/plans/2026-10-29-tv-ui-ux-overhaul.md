# 10-Foot OTT TV UI/UX Total Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Android TV application UI/UX with an industry-standard 10-foot OTT layout featuring a collapsible Left Navigation Sidebar, deterministic D-pad routing, cinema-dark OLED aesthetic, and zero-clipping content rails.

**Architecture:** Split the interface into a persistent, accessible Left Navigation Rail (`TvSidebar`) and an independent right-side scrolling Content View (`TvHomePage`). Update `SpatialNavigationManager` with deterministic Left/Right cross-pane routing between Sidebar and Content, and clean vertical transitions across Hero and Rails. Eliminate sticky topbars and heavy GPU filters.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React icons, Capacitor 7 (Android TV), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-tv-ui-ux-overhaul-design.md`

## Global Constraints
- Target platform: Android TV with standard D-pad directional remote controls (Up, Down, Left, Right, OK/Center, Back).
- 10-foot viewing distance legibility and contrast (minimum 7:1 contrast for headings, OLED-friendly dark palette `#060913`).
- 0% scroll clipping and 0 GPU lag: no `backdrop-filter: blur`, no sticky headers over scrolling content.
- 100% test passing across all existing and new test suites (Vitest).

## Review Focus
1. Navigating `Left` from any card in column 0 of any rail must cleanly highlight the current active Sidebar item.
2. Navigating `Right` from the Sidebar must cleanly enter the content feed (Hero CTA if on Home, or first card of grid).
3. Pressing `Up` on rail 0 must always land on the Hero CTA button (`hero-play-btn`), never get trapped.
4. Pressing remote `Back` when anywhere inside the content area must return focus to the active Sidebar item (`nav-home`), not exit the app.
5. Pressing remote `Back` when already focused on the Sidebar opens the Exit Confirmation Dialog.

---

### Task 1: Left Navigation Sidebar Component (`TvSidebar.tsx`) & Component Tests

**Files:**
- Create: `src/components/TvSidebar.tsx`
- Modify: `tests/components.test.tsx`
- Modify: `src/components/TvNavbar.tsx` (maintain backward compatibility / re-export)

**Interfaces:**
- Produces:
  ```typescript
  export interface TvSidebarProps {
    activeTab: 'home' | 'playlist' | 'history';
    onSelectTab: (tab: 'home' | 'playlist' | 'history') => void;
    onOpenExitModal: () => void;
  }
  export const TvSidebar: React.FC<TvSidebarProps>;
  ```

- [ ] **Step 1: Write the failing test for `TvSidebar` in `tests/components.test.tsx`**
  Add unit tests verifying:
  - Renders brand badge `LP` and `LAPOR PAK! TV`.
  - Renders 4 navigation items: `nav-home` (Beranda), `nav-playlist` (Playlist), `nav-history` (Riwayat), and `nav-exit` (Keluar).
  - Fires `onSelectTab` on selecting tabs and `onOpenExitModal` on selecting exit.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/components.test.tsx`
  Expected: FAIL (Cannot find module `TvSidebar`)

- [ ] **Step 3: Implement `TvSidebar.tsx`**
  Build a sleek 10-foot OTT vertical sidebar:
  - Compact width (`w-20` / 80px) expanding on focus or active to show clear text labels.
  - Distinct gold badge `[LP]` at top.
  - Focusable vertical items: `nav-home`, `nav-playlist`, `nav-history`, and `nav-exit`.
  - Focused state: high-contrast gold highlight (`bg-brand text-slate-950 font-bold scale-105 shadow-md`).

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx vitest run tests/components.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add src/components/TvSidebar.tsx tests/components.test.tsx src/components/TvNavbar.tsx; git commit -m "feat(tv): create OTT 10-foot Left Sidebar navigation component"`

---

### Task 2: Cross-Pane Spatial Navigation Engine Updates (`navigation.ts`) & Tests

**Files:**
- Modify: `src/services/navigation.ts`
- Modify: `tests/navigation.test.ts`

**Interfaces:**
- Consumes: `SpatialNavigation` singleton
- Produces:
  - Sidebar items: `nav-home`, `nav-playlist`, `nav-history`, `nav-exit`
  - Cross-pane movement:
    - From sidebar: `Right` moves to `hero-play-btn` or first visible card (`rail-X-card-0` / `playlist-card-0` / `history-card-0`).
    - From column 0 of any rail or grid or `hero-play-btn`: `Left` moves to active sidebar tab.
    - Vertical sidebar navigation: `nav-home` <-> `nav-playlist` <-> `nav-history` <-> `nav-exit`.
    - Content vertical navigation: `hero-play-btn` <-> `rail-0-card-X` <-> `rail-1-card-X`.

- [ ] **Step 1: Write failing tests for cross-pane navigation in `tests/navigation.test.ts`**
  Add unit tests verifying:
  - Moving `Right` from `nav-home` focuses `hero-play-btn` or first card in rail.
  - Moving `Left` from `rail-continue-card-0` or `hero-play-btn` focuses `nav-home`.
  - Moving `Down` / `Up` traverses the 4 sidebar items (`nav-home` -> `nav-playlist` -> `nav-history` -> `nav-exit`).

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/navigation.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement cross-pane deterministic routing in `navigation.ts`**
  Update `moveDeterministic()`:
  - Handle `nav-*` sidebar cluster:
    - `down`: `nav-home` -> `nav-playlist` -> `nav-history` -> `nav-exit`.
    - `up`: `nav-exit` -> `nav-history` -> `nav-playlist` -> `nav-home`.
    - `right`: targets `hero-play-btn` if present, else first card in current visible view (`rail-continue-card-0`, `rail-month-0-card-0`, `playlist-card-0`, or `history-card-0`).
    - `left`: stays in sidebar.
  - Handle content `left`:
    - If current card index is 0, or if on `hero-play-btn`, moving `left` targets the currently active or top sidebar item (`nav-home`).
  - Handle rail `up` from rail 0: targets `hero-play-btn`.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx vitest run tests/navigation.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add src/services/navigation.ts tests/navigation.test.ts; git commit -m "feat(tv): implement cross-pane sidebar and content deterministic spatial navigation"`

---

### Task 3: Redesign Hero Spotlight Billboard (`TvHeroSpotlight.tsx`)

**Files:**
- Modify: `src/components/TvHeroSpotlight.tsx`
- Modify: `tests/components.test.tsx`

**Interfaces:**
- Consumes: `VideoItem`
- Produces: Clean, cinema-grade Hero Billboard with full-bleed backdrop, gradient scrim, clear typography, and primary focusable `[ ▶ Putar Episode ]` CTA.

- [ ] **Step 1: Update component tests for `TvHeroSpotlight`**
  Verify the spotlight renders:
  - Title, channel badge (`TRANS7`), release date.
  - Focusable Play CTA button with id `hero-play-btn`.
  - Synopsis text.

- [ ] **Step 2: Implement OTT Hero Billboard in `TvHeroSpotlight.tsx`**
  - Use high-contrast layout with dark gradient scrim (no laggy CSS blurs).
  - Clean metadata badges: `TRANS7 HD`, Release Date, Duration.
  - High-visibility focusable Play button (`hero-play-btn`) with smooth focus ring (`ring-2 ring-white bg-brand text-slate-950`).
  - Pressing OK anywhere on hero or Play button plays the video.

- [ ] **Step 3: Run test to verify it passes**
  Run: `npx vitest run tests/components.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/components/TvHeroSpotlight.tsx tests/components.test.tsx; git commit -m "style(tv): overhaul Hero Spotlight into 10-foot OTT billboard"`

---

### Task 4: Content Rails, Video Cards & Focus Visibility (`TvRowRail.tsx`, `TvVideoCard.tsx`)

**Files:**
- Modify: `src/components/TvRowRail.tsx`
- Modify: `src/components/TvVideoCard.tsx`
- Modify: `src/hooks/useTvFocus.ts`

**Interfaces:**
- `TvVideoCard`: 16:9 aspect ratio, fixed 256px (`w-64`) width.
- `TvRowRail`: Horizontal scrolling container with generous vertical headroom (`py-4`).
- Focus styling: clean 2.5px golden outline (`border-brand scale-105 shadow-md`), 0% blur filters.

- [ ] **Step 1: Refactor `TvVideoCard.tsx`**
  - Enforce clean 16:9 thumbnail frame with duration badge in bottom-right.
  - Progress bar for continuing episodes.
  - Clean card title and episode metadata.
  - Focus state: `border-brand scale-105 shadow-md` (crisp, zero visual noise or neon glow).

- [ ] **Step 2: Refactor `TvRowRail.tsx`**
  - Section title with category icon and episode count.
  - Smooth horizontal scrolling container (`overflow-x-hidden flex gap-5 py-4`).
  - Card positioning ensures focused card never gets clipped.

- [ ] **Step 3: Run tests to verify they pass**
  Run: `npx vitest run tests/components.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/components/TvRowRail.tsx src/components/TvVideoCard.tsx src/hooks/useTvFocus.ts; git commit -m "style(tv): polish OTT content rails, video cards, and focus headroom"`

---

### Task 5: OTT Shell Layout & Remote Back Flow (`TvHomePage.tsx`, `App.tsx`, `TvExitModal.tsx`)

**Files:**
- Modify: `src/pages/TvHomePage.tsx`
- Modify: `src/components/TvExitModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Two-pane shell layout:
  - Left: `<TvSidebar />` (fixed vertical rail).
  - Right: `<main />` (scrollable content feed).
- Remote Back handling:
  - When focus is in content -> `SpatialNavigation.setFocus('nav-' + activeTab)`.
  - When focus is already in sidebar -> open `TvExitModal`.
  - In Exit Modal: `Cancel` resumes previous focus, `Confirm` exits application via Capacitor App plugin.

- [ ] **Step 1: Refactor `TvHomePage.tsx` with Two-Pane OTT Layout**
  - Wrap in `flex h-screen w-screen bg-[#060913] text-white overflow-hidden`.
  - Mount `<TvSidebar />` on the left.
  - Mount content container on the right (`flex-1 h-full overflow-y-auto px-8 py-6`).
  - Wire up remote Back button listener to handle two-tier back navigation (content -> sidebar -> exit modal).

- [ ] **Step 2: Polish `TvExitModal.tsx` for 10-foot TV**
  - Centered dialog with high-contrast text and two large focusable buttons: `[ Batal ]` and `[ Keluar ]`.

- [ ] **Step 3: Run full test suite**
  Run: `npx vitest run`
  Expected: 35/35 tests PASS

- [ ] **Step 4: Build web bundle and sync Capacitor Android**
  Run: `npm run build && npx cap sync android`
  Expected: Build succeeds with 0 errors; assets copied to Android.

- [ ] **Step 5: Commit and Push**
  Run: `git add .; git commit -m "feat(tv): implement complete 10-foot OTT shell layout, sidebar navigation, and two-tier back flow"; git push origin main`

---
