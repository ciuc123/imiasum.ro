# Updated: 2026-09-22

## ✅ Verified Complete

All items below have been verified working:

- [x] **Mobile categories overlay**: Full-screen overlay + hamburger toggle + accessibility (focus trap, ESC close, backdrop close)
- [x] **Post search**: Client-side on all blog pages (`/blog/`, `/blog/2/`, etc.) with pagination, fetches `/search-index.json` with FALLBACK_POSTS fallback
- [x] **Post preview cards**: Shows 3 recent posts at end of each post (PostPreviewCards component)
- [x] **Blog pagination**: Canonical URLs + rel="prev"/"rel="next" headers for SEO
- [x] **Search pagination styling**: Consistent button styling (fixed 2026-09-22)
- [x] **Remove unused CSS**: Removed `.mobile-category-menu` rule (fixed 2026-09-22)
- [x] **Mobile menu close bug**: Fixed event listener race condition (2026-09-22) — cleared pending handlers on open, properly tracked transitionend listeners
- [x] **Documentation**: Added "Adding a New Post" section to README with full workflow (2026-09-22)
- [x] **Animation refinements**: Improved overlay animations with better easing curves, shadow animations, and smooth transitions (2026-09-22)
- [x] **Search box UX**: Added focus states, hover effects, smooth transitions for better interactivity (2026-09-22)

## 📋 Medium Priority (Testing & Validation)

- [ ] **Test several old posts** for media URLs and rendering edge cases
- [ ] **Verify images/media on production** (CDN / Pages asset paths)

## ✨ Features & Polish (Optional)

- [ ] **Improve search ranking** (title/excerpt weight, term highlighting)

See `done.md` for full project history and archived checklist.

