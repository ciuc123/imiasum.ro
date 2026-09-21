All items moved to `done.md` (archived on 2026-09-19).


- [x] Mobile categories work: Completed — full-screen overlay implemented with a hamburger toggle and top-to-bottom slide animation (2026-09-19). Accessibility: focus management and focus trap implemented.
- [x] Post search: Implemented on `/blog/` — client-side search with pagination (min 3 characters). Currently available on the first blog page. Consider extending to paginated pages.
- [x] Adaugat carduri cu previzualizare la finalul postărilor (3 recent posts) — `PostPreviewCards` component added and included in post template.

Remaining / follow-up tasks discovered while auditing the blog implementation:

- [ ] bugfix search: search button doesn't trigger anything. posts is not defined at index.astro:2:82 in console
- [ ] Extend search to paginated blog pages (`/blog/2/`, `/blog/3/`, ...). Right now search is available on `/blog/` only.
- [ ] Consider creating a static `search-index.json` (in `public/`) to keep client bundles smaller and allow search on all pages without inlining posts.
- [ ] Test blog pagination across multiple pages and verify canonical/rel-prev/rel-next headers if needed.
- [ ] Test category pages and mobile category overlay on multiple devices and browsers.
- [ ] Test several old posts for media URLs and rendering edge cases.
- [ ] Verify images/media on production environment (CDN / Pages asset paths).
- [ ] add subtle open/close animation refinements for the overlay (timing/easing tweaks).
- [ ] Optional: improve search ranking (title/excerpt weight, highlighting matches).

Future ideas
- [ ] Add server-side or worker-based search if dataset grows (e.g., Lunr/miniSearch or Cloudflare Worker index).

See `done.md` for the full archived checklist and notes.

