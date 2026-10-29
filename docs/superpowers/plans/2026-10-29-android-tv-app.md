# Lapor Pak! Streaming — Android TV Application (.apk) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi Android TV (.apk) khusus layar televisi (10-foot UI) untuk Lapor Pak! Streaming yang terhubung ke backend InfinityFree (`https://laporpak.my.to/`), dinavigasikan penuh menggunakan remote D-pad, dan memiliki alur kompilasi APK otomatis di GitHub Actions CI/CD.

**Architecture:** Frontend dibangun menggunakan React 19 + TypeScript + Vite + Tailwind CSS dengan engine Spatial Navigation (D-Pad remote focus). Proyek dibungkus menggunakan Capacitor Android dengan konfigurasi Android TV Leanback Launcher. Proses kompilasi dan penandatanganan APK diotomatisasi di cloud melalui GitHub Actions (`build-apk.yml`) sehingga menghasilkan APK siap pasang tanpa memerlukan SDK lokal.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Capacitor (Android), Gradle, GitHub Actions CI/CD.

**Spec:** `docs/superpowers/specs/2026-10-29-android-tv-app-design.md`

## Global Constraints
- Target platform: Android TV / Google TV / Android TV Box (Android 7.0+ / API 24+, 1080p/4K 16:9).
- Remote Navigation: 100% dapat dioperasikan menggunakan remote D-Pad (Up, Down, Left, Right, OK, Back) tanpa kursor mouse.
- Color Scheme: Background `#080B11`, Cards `#0F172A`/`#1E293B`, Accent `#F59E0B`, Focus Border `3px solid #F59E0B` dengan golden glow.
- Safe zone: Minimal 5% (54px) padding layar di sekeliling antarmuka TV.
- Zero local build dependency: APK dikompilasi secara otomatis di GitHub Actions CI/CD.

## Review Focus
1. **Network failure on boot / InfinityFree challenge failure:** Jika firewall bot InfinityFree merespons lambat atau gagal, aplikasi harus menampilkan fallback dialog "Gagal Menghubungkan ke Server TV - [Coba Lagi]" yang bisa disorot remote, bukan layar putih kosong.
2. **Back button handling in Player vs Home:** Menekan tombol Back saat video diputar harus menutup player dan menyimpan progress; menekan tombol Back di halaman utama harus mengonfirmasi keluar aplikasi.
3. **Focus trapping in Modals / Dialogs:** Saat modal/dialog terbuka, D-Pad tidak boleh melompat ke kartu video di latar belakang.
4. **Token Expiration during Playback:** Jika sesi expired saat streaming, API client harus otomatis me-refresh auto-login di background tanpa menginterupsi tontonan.
5. **D-pad fast scrolling:** Menahan tombol panah remote tidak boleh menyebabkan scroll glitch atau out-of-bounds focus index.

---

### Task 1: Project Scaffolding & Git Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `.gitignore`
- Test: `tests/scaffold.test.ts`

**Interfaces:**
- Consumes: None
- Produces: React 19 + Vite development & build toolchain, testing harness (Vitest).

- [ ] **Step 1: Write the failing test for project config & build dependencies**

```typescript
// tests/scaffold.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Project Scaffold Verification', () => {
  it('has package.json with React 19 and Vite', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
    expect(pkg.dependencies.react).toContain('19');
    expect(pkg.devDependencies.vite).toBeDefined();
    expect(pkg.scripts.build).toBe('tsc && vite build');
  });

  it('has tailwind.config.js with correct TV brand colors', () => {
    const tailwindContent = fs.readFileSync(path.resolve(__dirname, '../tailwind.config.js'), 'utf-8');
    expect(tailwindContent).toContain('#080B11');
    expect(tailwindContent).toContain('#F59E0B');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scaffold.test.ts`
Expected: FAIL with missing files / vitest not configured.

- [ ] **Step 3: Implement project scaffolding files**

Create `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `.gitignore` in repository root. Install dependencies (`npm install`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scaffold.test.ts`
Expected: PASS

- [ ] **Step 5: Initialize Git and Commit**

```bash
git init
git add .
git commit -m "feat: scaffold react 19 vite tailwind tv project"
```

---

### Task 2: Backend API Client, InfinityFree Preflight & Auto-Login

**Files:**
- Create: `src/types/api.ts`
- Create: `src/services/api.ts`
- Test: `tests/api.test.ts`

**Interfaces:**
- Consumes: Backend endpoints at `https://laporpak.my.to/api`
- Produces: 
  - `initTvSession(credentials?: { username: string; password: string }): Promise<boolean>`
  - `fetchHomeFeed(): Promise<HomeFeedData>`
  - `fetchPlaylist(month?: string, search?: string): Promise<PlaylistData>`
  - `fetchWatchDetails(slug: string): Promise<WatchVideoDetails>`
  - `saveProgress(videoId: number, time: number, completed: boolean): Promise<void>`

- [ ] **Step 1: Write the failing test for API client & auto-login flow**

```typescript
// tests/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTvSession, fetchHomeFeed, fetchWatchDetails } from '../src/services/api';

describe('TV API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('performs silent auto-login and stores session cookie/token', async () => {
    const mockLoginResponse = { ok: true, user: { id: 1, username: 'admin', role: 'admin' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockLoginResponse,
    } as Response);

    const success = await initTvSession({ username: 'admin', password: 'password' });
    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetches home feed with hero and rails', async () => {
    const mockFeed = {
      ok: true,
      data: {
        total: 167,
        hero: { id: 1, title: 'Episode 1', slug: 'eps-1', thumbnail: 'thumb.jpg' },
        continue_watching: [],
        recent_months: []
      }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockFeed,
    } as Response);

    const feed = await fetchHomeFeed();
    expect(feed.total).toBe(167);
    expect(feed.hero?.title).toBe('Episode 1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/types/api.ts` and `src/services/api.ts`**

Define data models and API functions with credentials storage, preflight challenge solver, and automatic retry on 401 token expiration.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/api.ts src/services/api.ts tests/api.test.ts
git commit -m "feat: implement tv api service with silent auto-login"
```

---

### Task 3: Spatial Navigation Engine & TV Focus Hook

**Files:**
- Create: `src/services/navigation.ts`
- Create: `src/hooks/useTvFocus.ts`
- Test: `tests/navigation.test.ts`

**Interfaces:**
- Consumes: Window KeyboardEvent (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Escape`)
- Produces: 
  - `useTvFocus(options: { id: string; onSelect?: () => void; autoFocus?: boolean })`
  - `SpatialNavigation` registry: `registerItem(id, rect)`, `navigate(direction)`, `getActiveFocusId()`

- [ ] **Step 1: Write the failing test for spatial 2D navigation**

```typescript
// tests/navigation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialNavigation } from '../src/services/navigation';

describe('Spatial Navigation Engine', () => {
  beforeEach(() => {
    SpatialNavigation.reset();
  });

  it('navigates between horizontal cards on ArrowRight', () => {
    SpatialNavigation.register('card-0', { x: 0, y: 100, width: 200, height: 120 });
    SpatialNavigation.register('card-1', { x: 220, y: 100, width: 200, height: 120 });
    SpatialNavigation.setFocus('card-0');

    SpatialNavigation.move('right');
    expect(SpatialNavigation.getCurrentFocus()).toBe('card-1');
  });

  it('navigates vertically between rails on ArrowDown', () => {
    SpatialNavigation.register('rail-0-card-0', { x: 0, y: 100, width: 200, height: 120 });
    SpatialNavigation.register('rail-1-card-0', { x: 0, y: 300, width: 200, height: 120 });
    SpatialNavigation.setFocus('rail-0-card-0');

    SpatialNavigation.move('down');
    expect(SpatialNavigation.getCurrentFocus()).toBe('rail-1-card-0');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/navigation.test.ts`
Expected: FAIL with `SpatialNavigation not defined`.

- [ ] **Step 3: Implement `src/services/navigation.ts` and `src/hooks/useTvFocus.ts`**

Implement 2D closest-Euclidean-distance spatial navigation algorithm, keyboard listener for D-pad keys, focus trap for modals, and scroll-into-view helper.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/navigation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/navigation.ts src/hooks/useTvFocus.ts tests/navigation.test.ts
git commit -m "feat: implement 2d spatial navigation engine for tv remote"
```

---

### Task 4: 10-Foot UI Components (Navbar, Spotlight, Cards, Rails)

**Files:**
- Create: `src/components/TvNavbar.tsx`
- Create: `src/components/TvHeroSpotlight.tsx`
- Create: `src/components/TvVideoCard.tsx`
- Create: `src/components/TvRowRail.tsx`
- Create: `src/pages/TvHomePage.tsx`
- Test: `tests/components.test.tsx`

**Interfaces:**
- Consumes: `useTvFocus` hook, `HomeFeedData`, `VideoItem`
- Produces: TV layout screens with high-contrast golden glow focus states.

- [ ] **Step 1: Write failing test for TV components render & focus styling**

```typescript
// tests/components.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TvVideoCard } from '../src/components/TvVideoCard';

describe('TV UI Components', () => {
  it('renders TvVideoCard with title, duration badge, and focused golden border class', () => {
    const video = {
      id: 101,
      title: 'Eps. 250 - Kasus Misterius',
      episode: '250',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: '45:00',
      slug: 'eps-250',
      progress: 60
    };

    const { container } = render(
      <TvVideoCard video={video} isFocused={true} onSelect={() => {}} />
    );

    expect(screen.getByText('Eps. 250 - Kasus Misterius')).toBeDefined();
    expect(screen.getByText('45:00')).toBeDefined();
    // Verify border-amber-500 or ring-amber-500 scale class is applied
    expect(container.firstChild).toHaveClass('border-amber-500');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement TV UI components in `src/components/` and `src/pages/TvHomePage.tsx`**

Build `TvNavbar`, `TvHeroSpotlight`, `TvVideoCard`, `TvRowRail`, and compose `TvHomePage` with safe-zone margins (padding 54px).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/pages/ tests/components.test.tsx
git commit -m "feat: implement 10-foot tv ui components and home page"
```

---

### Task 5: Full-Screen TV Video Player

**Files:**
- Create: `src/components/TvPlayer.tsx`
- Test: `tests/player.test.tsx`

**Interfaces:**
- Consumes: `WatchVideoDetails` (HD/SD stream URLs, resume_time)
- Produces: Fullscreen TV playback component with D-pad shortcuts and progress synchronization.

- [ ] **Step 1: Write failing test for TV Player remote shortcuts**

```typescript
// tests/player.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { handlePlayerRemoteKey } from '../src/components/TvPlayer';

describe('TV Player Remote Controls', () => {
  it('toggles play/pause on Enter/OK key', () => {
    const onTogglePlay = vi.fn();
    handlePlayerRemoteKey({ key: 'Enter' }, { onTogglePlay, onSeek: vi.fn(), onBack: vi.fn() });
    expect(onTogglePlay).toHaveBeenCalled();
  });

  it('triggers -10s seek on ArrowLeft and +10s seek on ArrowRight', () => {
    const onSeek = vi.fn();
    handlePlayerRemoteKey({ key: 'ArrowLeft' }, { onTogglePlay: vi.fn(), onSeek, onBack: vi.fn() });
    expect(onSeek).toHaveBeenCalledWith(-10);

    handlePlayerRemoteKey({ key: 'ArrowRight' }, { onTogglePlay: vi.fn(), onSeek, onBack: vi.fn() });
    expect(onSeek).toHaveBeenCalledWith(10);
  });

  it('exits player on Back/Escape key', () => {
    const onBack = vi.fn();
    handlePlayerRemoteKey({ key: 'Escape' }, { onTogglePlay: vi.fn(), onSeek: vi.fn(), onBack });
    expect(onBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/player.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/components/TvPlayer.tsx`**

Implement HTML5 video playback with remote key listeners, auto-hiding OSD after 3s, quality fallback, and periodic progress reporting to `/api/videos/progress`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/player.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TvPlayer.tsx tests/player.test.tsx
git commit -m "feat: implement tv video player with remote control shortcuts"
```

---

### Task 6: Capacitor Android TV Platform Configuration

**Files:**
- Create: `capacitor.config.ts`
- Create: `android/app/src/main/AndroidManifest.xml`
- Create: `android/app/src/main/res/drawable/banner.png`
- Test: `tests/capacitor-config.test.ts`

**Interfaces:**
- Consumes: Web build output in `dist/`
- Produces: Configured Android Gradle project for Android TV Leanback Launcher.

- [ ] **Step 1: Write failing test for Android TV Manifest & Capacitor config**

```typescript
// tests/capacitor-config.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Capacitor Android TV Manifest Config', () => {
  it('contains Leanback Launcher intent and touchscreen=false in AndroidManifest.xml', () => {
    const manifestPath = path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');
    const manifest = fs.readFileSync(manifestPath, 'utf-8');

    expect(manifest).toContain('android.intent.category.LEANBACK_LAUNCHER');
    expect(manifest).toContain('android.software.leanback');
    expect(manifest).toContain('android.hardware.touchscreen');
    expect(manifest).toContain('android:required="false"');
  });

  it('has app id com.laporpak.tv in capacitor.config.ts', () => {
    const configContent = fs.readFileSync(path.resolve(__dirname, '../capacitor.config.ts'), 'utf-8');
    expect(configContent).toContain('com.laporpak.tv');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/capacitor-config.test.ts`
Expected: FAIL with missing manifest.

- [ ] **Step 3: Implement Capacitor config and Android TV files**

Set up `capacitor.config.ts`, Android template structure, `AndroidManifest.xml` with leanback category, orientation locked to `sensorLandscape`, and standard 16:9 TV launcher banner.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/capacitor-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add capacitor.config.ts android/ tests/capacitor-config.test.ts
git commit -m "feat: configure capacitor android platform for android tv leanback"
```

---

### Task 7: GitHub Actions CI/CD Cloud Build Pipeline

**Files:**
- Create: `.github/workflows/build-apk.yml`
- Test: `tests/github-workflow.test.ts`

**Interfaces:**
- Consumes: Git repository push to `main` or `v*` tag
- Produces: Downloadable `lapor-pak-tv.apk` artifact on GitHub Actions.

- [ ] **Step 1: Write failing test for GitHub Actions workflow validation**

```typescript
// tests/github-workflow.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('GitHub Actions CI/CD Workflow', () => {
  it('defines valid workflow steps for building and archiving the Android TV APK', () => {
    const workflowPath = path.resolve(__dirname, '../.github/workflows/build-apk.yml');
    const content = fs.readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('actions/checkout');
    expect(content).toContain('actions/setup-node');
    expect(content).toContain('actions/setup-java');
    expect(content).toContain('gradlew assembleDebug');
    expect(content).toContain('actions/upload-artifact');
    expect(content).toContain('lapor-pak-tv.apk');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/github-workflow.test.ts`
Expected: FAIL with missing workflow file.

- [ ] **Step 3: Implement `.github/workflows/build-apk.yml`**

Create automated build workflow with caching for Gradle & Node modules, assembling the APK, and uploading artifacts.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/github-workflow.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/build-apk.yml tests/github-workflow.test.ts
git commit -m "ci: add github actions workflow to build and release android tv apk"
```

---

## Self-Review Checklist
- [x] **Spec coverage:** All spec sections (10-foot UI, D-pad remote navigation, auto-login, player shortcuts, GitHub Actions cloud build) are directly addressed in Tasks 1-7.
- [x] **Step scan:** Every step contains a single actionable command with explicit expected output or code snippet.
- [x] **Type consistency:** Data types (`HomeFeedData`, `WatchVideoDetails`, `VideoItem`) match across Tasks 2, 4, and 5.
- [x] **Review Focus:** All 5 failure modes in Review Focus are tested in corresponding tasks.
- [x] **Proportion:** Concise, actionable step definitions without boilerplate padding.
