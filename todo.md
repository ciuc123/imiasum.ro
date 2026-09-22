# Todo — imiasum.ro Blog

Updated: 2026-09-22

## ✅ Completed (2026-09-22)

- [x] **Move search bar to header** — Visible on all pages everywhere
  - Desktop: Centered in header (professional placement)
  - Mobile: Sticky bar below header (always accessible)
  - Removed redundant search from blog pages
  - Global search across all posts

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

## 📋 Medium Priority (Testing & Validation)

- [ ] **Test several old posts** for media URLs and rendering edge cases
- [ ] **Verify images/media on production** (CDN / Pages asset paths)

## ✨ Features & Polish (Optional)

- [ ] **Improve search ranking** (title/excerpt weight, term highlighting)

---

See `done.md` for completed features and project history.

