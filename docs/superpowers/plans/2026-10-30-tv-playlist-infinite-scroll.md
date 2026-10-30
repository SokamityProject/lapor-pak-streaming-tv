# TV Playlist Infinite Scroll & Lazy Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement seamless cursor-based infinite scroll and lazy loading in the Android TV Playlist tab so users can navigate with their remote D-pad through all 167 episodes from October down to February 2026.

**Architecture:** Extend `fetchPlaylist` in `api.ts` to support cursor and limit parameters. In `TvHomePage.tsx`, track `playlistCursor`, `hasMore`, `total`, and `isLoadingMore`. Subscribe to TV spatial focus events so when remote focus reaches the last 2 rows of the 3-column grid (`idx >= length - 6`), next batch is pre-fetched and seamlessly appended to the grid without interrupting D-pad navigation.

**Tech Stack:** React 19, TypeScript, Vitest, Tailwind CSS, Capacitor 7, Lucide Icons.

**Spec:** In-session design approved by user on 2026-10-30.

## Global Constraints

- Remote Operability: 100% remote D-pad compatible; focus must never be trapped or lost during data append.
- Zero Coordinate Glitch: Append items while keeping existing card DOM elements stable (`key={video.id}`).
- Keyset Cursor Pagination: Use backend's native `cursor` parameter on `/api/videos`.
- TV 10-Foot Legibility: High-contrast status badge and loading feedback.

## Review Focus

1. Rapid D-pad down navigation across pagination boundary: ensure focus transitions cleanly from card N to card N+1 without returning to top.
2. Network latency during lazy load: prevent multiple duplicate requests while `isLoadingMore` is true.
3. End-of-archive boundary: when `has_more` is false, stop triggering requests and show completion label.
4. Local watch progress persistence: newly lazy-loaded cards must reflect local playback progress and completion badges.
5. Tab switching: switching away from Playlist and back should retain loaded videos without resetting to 24.

---

### Task 1: Extend `fetchPlaylist` to Support Cursor and Limit Parameters

**Files:**
- Modify: `src/services/api.ts:260-275`
- Test: `tests/api.test.ts`

**Interfaces:**
- Consumes: Backend `/api/videos?cursor={c}&limit={l}&month={m}&search={s}`
- Produces: `fetchPlaylist(options?: { month?: string; search?: string; cursor?: string | null; limit?: number }): Promise<PlaylistData>`

- [ ] **Step 1: Write failing test for `fetchPlaylist` with cursor and limit**

```typescript
it('fetchPlaylist accepts cursor and limit options and passes them to API query', async () => {
  const result = await fetchPlaylist({ cursor: 'test-cursor-123', limit: 24 });
  expect(result.items).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api.test.ts`
Expected: FAIL if options object signature is not supported.

- [ ] **Step 3: Implement updated `fetchPlaylist` in `src/services/api.ts`**

Support both object options `{ month, search, cursor, limit }` and backward-compatible positional arguments `(month?: string, search?: string)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/api.ts tests/api.test.ts
git commit -m "feat(api): support cursor and limit in fetchPlaylist"
```

---

### Task 2: Implement TV Remote-Aware Infinite Scroll & Lazy Loading in `TvHomePage`

**Files:**
- Modify: `src/pages/TvHomePage.tsx:55-115, 230-260`
- Test: `tests/components.test.tsx`

**Interfaces:**
- Consumes: `fetchPlaylist` with cursor pagination
- Produces: Seamless 3-column TV grid that lazy-loads batches of 24 episodes as focus approaches bottom

- [ ] **Step 1: Write failing test for TV playlist lazy loading on remote focus**

```typescript
it('lazy-loads next batch of playlist videos when focus approaches the bottom of the grid', async () => {
  // Render TvHomePage on playlist tab
  // Verify initial 24 items
  // Focus on playlist-card-20
  // Verify fetchPlaylist called with next cursor
  // Verify new items appended to grid
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components.test.tsx -t "lazy-loads next batch"`
Expected: FAIL

- [ ] **Step 3: Implement lazy loading state, focus listener, and UI in `src/pages/TvHomePage.tsx`**

- State: `playlistVideos`, `playlistCursor`, `playlistHasMore`, `playlistTotal`, `isLoadingMore`.
- Trigger: In `SpatialNavigation.subscribe`, check if `currentId` matches `playlist-card-(\d+)`. If `idx >= playlistVideos.length - 6` and `playlistHasMore && !isLoadingMore`, call `handleLoadMore()`.
- UI: Show count `"Menampilkan X dari Y Berkas"`, bottom loading spinner while fetching, and completion message when all loaded.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/TvHomePage.tsx tests/components.test.tsx
git commit -m "feat(tv): implement infinite scroll and lazy loading in playlist tab"
```

---

### Task 3: Verification, Full Test Suite, Production Build & Capacitor Sync

**Files:**
- Test: All suites (`npm test`)
- Build: `npm run build`
- Sync: `npx cap sync android`

- [ ] **Step 1: Run full test suite across all 10 test files**

Run: `npm test`
Expected: PASS (all tests pass)

- [ ] **Step 2: Compile TypeScript and build production web bundle**

Run: `npm run build`
Expected: Build succeeds with 0 errors

- [ ] **Step 3: Sync Capacitor Android platform assets**

Run: `npx cap sync android`
Expected: Sync succeeds

- [ ] **Step 4: Commit and push to GitHub `main`**

```bash
git push origin main
```
