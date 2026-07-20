This is a large scope (14 features). I'll ship them in 4 phased batches so the app stays stable between rounds. Confirm the order or tell me which to prioritize/drop and I'll start with Phase 1.

## Phase 1 — Core UX wins (foundation)
1. **Bookmark system** — `useBookmarks` hook (localStorage), heart button on `MangaCard` + `MangaDetail`, wire up `Bookmarks.tsx` grid.
2. **Reading History page** — new `/history` route, list recently read manga chronologically with cover, last chapter, timestamp, and Resume button. Add nav link.
3. **Reading stats dashboard** — small stats block on History page: total chapters read, unique series, favorite genre (computed from history + manga data).

## Phase 2 — Reader upgrades
4. **Keyboard navigation** — ← / → for pages, `F` fullscreen, `Esc` exit reader.
5. **Vertical / long-strip mode** — toggle button in top bar; switches between paged and webtoon scroll view.
6. **Per-page progress** — extend `useReadingHistory` entries with `lastPage`; restore on reopen; show `x/y` progress on chapter rows.
7. **Zoom & pan** — pinch/scroll zoom + drag pan on page images (paged mode).
8. **Page preloading** — prefetch next 2–3 images via `new Image()`.

## Phase 3 — Discovery
9. **Advanced Browse filters** — multi-select genres (chips), sort (rating / popularity / newest by year), status filter, year range. Refactor `Browse.tsx` with a filter sidebar/sheet.
10. **Recently Updated** section on Home — sorted by manga `updatedAt` (add field to mock data if missing).
11. **Recommendations** — "Because you read X" row on Home computed from last-read manga's genres.
12. **Genre landing pages** — route `/genre/:name` with curated grid + hero; link from genre chips.

## Phase 4 — Platform & mobile
13. **Mobile drawer nav** — Sheet-based drawer on `<md`, swipe-to-open via framer-motion drag, replaces inline nav links on mobile.
14. **PWA (installable only)** — manifest + icons + head tags for Add to Home Screen. No service worker / offline caching by default (per PWA guidance) unless you explicitly want offline chapters — say the word and I'll add the guarded `vite-plugin-pwa` offline layer instead.

## Technical notes
- All state stays client-side (localStorage). No backend needed.
- Extend `ReadEntry` with `lastPage?: number` — backward compatible.
- Add `year`, `updatedAt`, `popularity` to `src/data/manga.ts` if missing to power filters/sort.
- New files (est.): `useBookmarks.ts`, `pages/History.tsx`, `pages/Genre.tsx`, `components/BookmarkButton.tsx`, `components/BrowseFilters.tsx`, `components/MobileNav.tsx`, `public/manifest.webmanifest` + icons.
- Reader zoom via CSS transform + wheel/pinch handlers; fullscreen via `document.fullscreenElement` API.

**Reply with "go" to start Phase 1, or tell me to reorder / drop items.**