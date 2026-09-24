# Todo — imiasum.ro Blog

Updated: 2026-09-24

---

## 🎨 High Priority: Modernize Blog UX

The current blog feels too minimal. Features (Search, pagination, and overall layout) are fine and should ideally remain the same. 
Look & feel (think professionl high ticket coaching, iphone 18pro max blue) / colours need modernization.

### Current Issues:
- Search results feel disconnected from browsing — no context about current page
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
- Add visual indicators for current page/category

### Implemented on 2026-09-24
- [x] cohesive redesign across header, listing pages, post pages, sidebar, pagination, and search results
- [x] simple breadcrumbs across blog, category, post, search, and 404 states
- [x] `theme-blue` / `theme-purple` theme switching with persisted preference
- [x] active-state indicators for blog/category navigation on desktop and mobile
- [x] stronger visual hierarchy with card surfaces, spacing, context pills, and clearer page intros
- [x] mobile navigation refreshed to match the redesigned desktop experience

### Optional follow-up proposals
- [ ] add reading progress bar on post pages
- [ ] add “back to top” floating action on long posts and long search results
- [ ] add keyboard shortcut (`/`) to focus global search
- [ ] add category counts in sidebar/mobile menu

**Status**: Core redesign complete — follow-up polish items optional

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
## ✨ SEO & GEO

- [ ] propose SEO improvements for blog posts (meta tags, structured data, Open Graph)
- [ ] propose GEO improvements for blog posts (geo meta tags, structured data for local SEO)

---

See `done.md` for completed features and project history.
