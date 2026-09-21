# imiasum.ro — Migration Checklist (Archive)

Archived: 2026-09-19

Summary of confirmations made during archive:

- Items reviewed and archived from `todo.md`.
- Confirmations provided by user: 1) ok, 2) ok.
- Unicode normalization: performed.
- Redirects: not needed (no redirect rules required for current deployment).
- Mobile categories: work started (in-progress).
- Search: planned to be implemented later.

Full checklist (archived copy with updates):

## 1. Content & Data

- [x] Import 356 legitimate published posts
- [x] Exclude attacker posts
- [x] Import categories
- [x] Copy media to public/uploads
- [x] Verify referenced media exists
- [x] Normalize same-domain upload URLs
- [ ] Recover ????-corrupted content from older backup (later)
- [x] Optional: Unicode NFC normalization (performed)
- [x] Unpublish six clearly corrupted posts from the public site
    - Raw imported data remains preserved
    - 350 posts currently published

## 2. Blog UX

- [x] Improve post formatting / CSS
    - [x] Paragraphs
    - [x] Images & alignment
    - [x] Lists
    - [x] Blockquotes
    - [x] Tables
    - [x] Mobile layout

- [x] Add blog pagination
    - [x] /blog/
    - [x] /blog/2/
    - [x] /blog/3/
    - [x] ...

- [x] Add category pages
    - [x] /category/<slug>/

- [x] Add category links to posts
- [x] Add category links to blog listings
- [x] Improve homepage
- [x] Remove bogus root index.html from development branch
- [x] Keep category navigation visible in the persistent header

## 3. URL Preservation

- [x] Verify all 356 imported post slugs
- [x] Verify generated old post URLs
- [x] Check duplicate slugs
- [x] Check Unicode/special-character slugs
- [x] Identify old non-post URLs that need handling
- [x] Add redirects where necessary (not needed)

## 4. Site Infrastructure

- [x] Configure Astro sitemap
- [x] Add robots.txt
- [x] Add RSS
- [x] Verify sitemap contents
- [x] Verify RSS output
- [x] Verify canonical https://imiasum.ro URLs
- [x] Add favicon
- [x] Add basic site metadata
- [x] Run final production build

## 5. Cloudflare Pages

### main

- [x] Configure no build command
- [x] Configure root output directory
- [x] Commit and push coming-soon page
- [x] Attach imiasum.ro
- [x] Deploy and test coming-soon page

### development

- [x] Connect development branch deployment
- [x] Build command: npm run build
- [x] Output directory: dist
- [x] Attach development.imiasum.ro
- [x] Deploy preview
- [x] Test homepage
- [x] Test blog pagination
- [x] Test category pages
- [x] Test several old posts
- [x] Test images/media
- [x] Test mobile

## 6. DNS Cutover

- [x] Verify imiasum.ro points to the Cloudflare Pages deployment
- [x] Configure https://imiasum.ro/
- [x] Verify https://development-imiasum-ro.andrei-eab.workers.dev/
- [x] Verify HTTPS
- [x] Verify old post URLs
- [x] Verify sitemap
- [x] Verify RSS
- [x] Monitor site for a few days

## 7. AWS / WordPress Cleanup

- [x] Preserve original SQL backup
- [x] Preserve BackWPup archives
- [x] Preserve security/backdoor evidence
- [x] Remove WordPress EC2
- [x] Remove RDS/database resources if unused
- [x] Remove unused S3 resources
- [x] Remove unused security groups/load balancers
- [x] Check AWS resources for anything remaining
- [x] Check AWS billing

———

## Final notes / next steps at archive time

- Mobile categories: In progress — started. The mobile category menu will be converted to a full-screen overlay to avoid right-side overflow. Work started on markup/CSS.
- Post search: Planned — resume later. Recommended client-side search using `src/data/posts.js` (or a small static index) when ready.
- If you want me to continue, I can open a PR with the mobile categories changes and implement the search next when you say so.
 - [x] Mobile categories: implemented — full-screen overlay + hamburger toggle + accessibility (focus trap, ESC, close on backdrop) (2026-09-19 / 2026-09-21)
 - [x] Post search: implemented — client-side search now fetches `/search-index.json` and falls back to an embedded payload. Added `scripts/generate-search-index.mjs` and integrated into `npm run build` (2026-09-21).

(End of archive)

