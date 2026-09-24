# Todo — imiasum.ro Blog

Updated: 2026-09-24

---

## 🎨 High Priority: Modernize Blog UX

The current blog feels inconsistent and confusing. Search visibility, pagination behavior, and overall layout need modernization.

### Current Issues:
- Search box only appears on `/blog/` and paginated blog pages, not visible on category pages or single posts
- Pagination shows on blog index but disappears on search results or category listings  
- Search results feel disconnected from browsing — no context about current page
- Mobile layout feels cramped with categories + limited space
- Blog structure lacks clear visual hierarchy and consistent spacing
- No visual feedback for current location (active category/page)

### Desired Behavior:
A modern, consistent blog UX where:
1. **Search is always visible and prominent** — sticky or persistent search bar across all pages (blog index, categories, search results)
2. **Pagination is consistent** — same visual treatment everywhere (blog, categories, search results)
3. **Current context is clear** — highlight active category, show breadcrumbs or "You're viewing posts from: Category Name"
4. **Visual hierarchy is strong** — clear sections, generous spacing, modern typography
5. **Mobile is clean** — remove unnecessary chrome, optimize for reading
6. **Blog feels like a unified space** — not disconnected pages, but a cohesive reading experience

### Implementation Scope:
- Add search bar to category pages (`src/pages/category/[slug].astro`, `src/pages/category/[slug]/[page].astro`)
- Make pagination consistently styled across all listings
- Add context headers for category/search result pages
- Refactor mobile layout for clarity
- Update CSS for modern spacing and typography (consider using CSS Grid for better layout control)
- Add visual indicators for current page/category
- Consider sticky search header for mobile (vs hamburger overlay)

**Status**: Not started — needs design review before implementation

---

## 🔐 High Priority: Admin System for Blog Post Management

One of the next major decisions: implementing an admin interface where you can log in and add/edit posts directly (instead of manually editing JSON files and rebuilding).

**Status**: Decision phase — see `docs/admin-system.md` for detailed analysis of 5 implementation options

### Options Summary:

1. **Headless CMS** (Contentful, Supabase, Strapi) — Hosted service, built-in UI
2. **Cloudflare Workers + KV** — Serverless, leverages existing stack
3. **Express.js + Database** — Traditional Node backend with PostgreSQL/SQLite
4. **GitHub-as-CMS** — Edit files via GitHub API, keep everything in Git
5. **Minimal Custom API** — Simple file-based backend, learning-friendly

See `docs/admin-system.md` for:
- Detailed pros/cons of each approach
- Architecture diagrams
- Quick start code examples
- Cost/maintenance comparison

**Next step**: Review options and choose an approach, then implement auth + post creation UI

---

## 📋 Medium Priority (Testing & Validation)

- [ ] **Test several old posts** for media URLs and rendering edge cases
- [ ] **Verify images/media on production** (CDN / Pages asset paths)

## ✨ Features & Polish (Optional)

- [ ] **Improve search ranking** (title/excerpt weight, term highlighting)

---

See `done.md` for completed features and project history.
