# Todo — imiasum.ro Blog

Updated: 2026-09-22

## ✅ Completed (2026-09-22)

- [x] **Move search bar to header** — Visible on all pages everywhere
  - Desktop: Centered in header (professional placement)
  - Mobile: Sticky bar below header (always accessible)
  - Removed redundant search from blog pages
  - Global search across all posts

- [x] **Update pagination** — Show smart range instead of all pages
  - Shows: first 3 pages, last 3 pages, and 3 pages around current page
  - Uses ellipsis (…) for gaps between ranges
  - Example: 1 2 3 … 15 16 17

- [x] **Rename Blog navigation** — Changed to "Toate postarile" (All posts)
  - Updated header link in desktop nav
  - Updated mobile menu link

- [x] **Simplify blog listing pages** — Removed redundant header
  - Removed "Educație relațională" / "Blog" / description header from blog pages
  - Posts now display immediately after navigation/search

- [x] **Fix mobile header** — Search bar fully visible + hide/show on scroll (IMPLEMENTED 2026-09-22)
  - Mobile search bar now part of header (not separate sticky element)
  - Header layout: Row 1 (Title | Hamburger), Row 2 (Search bar, full width)
  - Header hides on scroll-down, shows on scroll-up for better UX
  - Uses `transform: translateY(-100%)` for smooth animation

- [x] **Fix global search results display** — Show list instead of single post (FIXED 2026-09-22)
  - Search now displays results as a paginated list on the page
  - Works on desktop and mobile
  - Shows up to 10 results per page with pagination controls
  - Click on a result to visit the full post
  - Mobile search auto-scrolls to results
  - Success message shows count of results found
  - Main page content hidden while viewing search results
  - Clear search input to return to normal page view

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

