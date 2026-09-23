# IMIASUM.RO BLOG - IMPLEMENTATION DOCUMENTATION

This document describes the current implementation of the imiasum.ro blog in detailed specifications. Use this as a reference to recreate or restore the blog's functionality.

---

## 1. TECHNOLOGY STACK & CONFIGURATION

### Core Framework
- **Static Site Generator**: Astro (latest version)
- **Language**: JavaScript/ES Modules (`.mjs`, `.astro` files)
- **Styling**: Plain CSS (no preprocessors)
- **Hosting**: Cloudflare Pages (via Wrangler)
- **Node.js Runtime**: Required for build scripts

### Dependencies (`package.json`)
```
- astro (latest)
- @astrojs/rss (latest) — RSS feed generation
- @astrojs/sitemap (^3.7.4) — Sitemap generation
- @astrojs/check (^0.9.10) — Type checking
- typescript (^6.0.3) — TypeScript support
- live-server (^1.2.1) — Local development server (devDep)
```

### Astro Configuration (`astro.config.mjs`)
- Site URL: `https://imiasum.ro`
- Integrations: Sitemap plugin enabled
- Vite polling enabled on Windows for file watching (100ms interval)
- Output: Static HTML in `dist/` directory

### Build Scripts (`package.json`)
- `npm run dev` — Start Astro dev server with hot reload
- `npm run build` — Generate search index, then build site
- `npm run start` — Build and serve `dist/` locally (production preview)
- `npm run generate-search-index` — Manually regenerate search index

---

## 2. DATA STRUCTURE & POSTS

### Posts Organization
Posts are split by year in JSON files: `src/data/2016.json` through `src/data/2024.json`.

Each post file is an array of post objects.

### Post Object Schema
```json
{
  "id": 4693,
  "author": 2,
  "date": "2024-01-08 09:32:17",
  "modified": "2024-01-08 10:58:07",
  "slug": "incotro",
  "title": "Încotro?",
  "excerpt": "",
  "content": "<p>HTML content...</p>",
  "categories": [
    {
      "id": 23,
      "name": "Recomandări",
      "slug": "recomandari",
      "description": "",
      "parent": 0
    }
  ]
}
```

**Key Fields**:
- `id`: Unique identifier (some are excluded by filter)
- `date`: ISO format or MySQL datetime (used for sorting)
- `slug`: URL-safe identifier (lowercase, hyphens)
- `title`: Post title
- `excerpt`: Short summary (optional)
- `content`: HTML body (can include inline styles, images)
- `categories`: Array of category objects linked to post

### Posts Aggregation (`src/data/posts.js`)
- Imports all year files (2016–2024)
- Merges into single array
- **Sorts by date descending** (newest first)
- **Filters out removed posts** by ID: `[4589, 4601, 4618, 4650, 4668, 4682]`
- Exports as `const posts` (used throughout app)

### Removed Posts
Six posts are hardcoded as removed (same IDs in `posts.js` and `generate-search-index.mjs`). Keep these lists in sync.

### Categories (`src/data/categories.json`)
Array of category objects:
```json
[
  {
    "id": 6,
    "name": "Asuma-ti puterea interioara",
    "slug": "asuma-ti-puterea-interioara",
    "description": "",
    "parent": 0
  }
]
```
- Categories are displayed in sidebar and mobile menu
- Posts can reference multiple categories

---

## 3. PAGES & ROUTING

### Page Structure

#### Home Page (`src/pages/index.astro`)
- Route: `/`
- Displays: Latest 8 posts with excerpts
- Components: `PostList` (with `showExcerpt=true`)
- No pagination

#### Blog Listing (`src/pages/blog/index.astro`)
- Route: `/blog/`
- Displays: All posts paginated (20 per page)
- Components: `PostList`, `Pagination`
- Canonical: `/blog/` (page 1)

#### Blog Pagination (`src/pages/blog/[page].astro`)
- Route: `/blog/2/`, `/blog/3/`, etc.
- Dynamic static generation via `getStaticPaths()`
- Generates pages 2 onwards (page 1 handled by index.astro)
- **Note**: Page count calculated as `Math.ceil(posts.length / POSTS_PER_PAGE)` minus 1
- Components: `PostList`, `Pagination`

#### Individual Post (`src/pages/[slug].astro`)
- Route: `/{slug}/`
- Dynamic static generation from all posts
- Displays: Full post content, metadata, categories, related posts
- Components: `PostPreviewCards` (3 related articles at bottom)
- **Related posts**: Filters out current post, shows 3 most recent

#### Category Pages (`src/pages/category/[slug].astro`)
- Route: `/category/{slug}/`
- Displays: Posts filtered by category (page 1, paginated)
- Generated for each category in `categories.json`
- Components: `PostList`, `Pagination`
- Header: "Categoria: {name}"

#### Category Pagination (`src/pages/category/[slug]/[page].astro`)
- Route: `/category/{slug}/2/`, etc.
- Similar to blog pagination but filtered by category
- Each category has its own page set

#### 404 Page (`src/pages/404.astro`)
- Route: Catches unmatched URLs
- Message: "Pagina nu a fost găsită" (Page not found)
- Link back to home

---

## 4. COMPONENTS

### Layout (`src/layouts/Layout.astro`)
Master layout wrapping all pages. **443 lines** of Astro + embedded scripts.

**Key Features**:

#### Head Section
- Charset: UTF-8
- Viewport: responsive
- Title: Dynamic (from page props)
- Description: Dynamic with fallback
- Canonical URL: Dynamic (auto-generated from request URL)
- Favicon: `/favicon.svg`
- Stylesheet: `/styles.css`

#### Header (Sticky)
- Site title: "Educație Relațională" (links to home)
- Desktop search bar: Input + button
- Primary nav: "Toate postarile" link
- Mobile hamburger toggle (hidden on desktop)
- Mobile search bar (hidden on desktop)

#### Mobile Navigation Panel
- Full-screen overlay (fixed positioning)
- Slide-in animation from top
- Contains: "Toate postarile" + all categories
- Keyboard trap (Tab wraps within panel)
- Esc key closes
- Focus management on open/close

#### Main Content
- Two-column layout (desktop): main content + 220px sidebar
- Mobile: Single column (sidebar hidden)
- Main displays `<slot />` content
- Sidebar displays all categories as navigation links

#### Search Results Container
- Empty div `#global-search-results` (hidden by default)
- Populated dynamically by search script
- When results show, main content hides

#### Embedded Scripts

**1. Header Scroll Behavior**
- Hides header when scrolling down past 50px
- Shows header when scrolling up
- Uses `classList` to toggle `header-hidden` (CSS: `transform: translateY(-100%)`)

**2. Mobile Navigation Toggle**
- Opens/closes mobile menu panel
- Focus trap: Tab cycles through focusable elements
- Transition end event handler for cleanup
- Escape key closes panel
- Click outside (on backdrop) closes panel

**3. Fallback Posts JSON**
```javascript
window.FALLBACK_POSTS = [array of posts with slug, title, excerpt, content, date]
```
Inline as `<script set:html={...}>` before search script.
Used if `search-index.json` fails to load.

**4. Global Search Module** (type: module)
- Loads posts from `/search-index.json` (or fallback)
- Minimum 3 characters to search
- Searches in: title, excerpt, content
- Displays paginated results (10 per page)
- Pagination UI with "Anterior" / "Următor" buttons
- Shows: "S-au găsit N rezultate" message
- Clears results when search input is cleared
- Works on both desktop and mobile inputs
- **Important**: Search is client-side only (frontend JS)

---

### PostList (`src/components/PostList.astro`)
Simple reusable component.

**Props**:
- `posts`: Array of post objects (required)
- `showExcerpt`: Boolean (default: false)

**Renders**:
- Div with class `post-list`
- Each post as `<article class="post-card">`
- Date: `<time>` element
- Title: `<h2>` with link to `/{slug}/`
- Excerpt: `<p class="post-excerpt">` (only if `showExcerpt=true` and excerpt exists)
- Categories: Links to `/category/{slug}/` (if categories exist)

---

### PostPreviewCards (`src/components/PostPreviewCards.astro`)
Related articles section shown at bottom of post pages.

**Props**:
- `posts`: Array of all posts (required)
- `currentSlug`: String slug of current post
- `count`: Number of cards to show (default: 3)

**Logic**:
- Filters out current post by slug
- Takes first N most recent (since posts are pre-sorted by date desc)
- Renders as `<section class="related-posts">`
- Each article as `<article class="related-card">`
- Shows title, excerpt (if exists), date

---

### Pagination (`src/components/Pagination.astro`)
Smart pagination component used in blog and category pages.

**Props**:
- `basePath`: String (e.g., `/blog/`, `/category/nature/`)
- `currentPage`: Number (current page)
- `totalPages`: Number (total page count)

**Logic**:
- Hides if `totalPages <= 1`
- Shows smart page range:
  - Always first 3 pages
  - Always last 3 pages
  - Always range of 3 around current page
  - Ellipsis between gaps
- Navigation wrapper: "← Anterior" | "Pagina X din Y" | "Următor →"
- Page links generated via `pageUrl(basePath, page)` utility

**Page URL Generation** (`pageUrl`):
- Page 1: Returns basePath only (e.g., `/blog/`)
- Page 2+: Returns `${basePath}{page}/` (e.g., `/blog/2/`)

---

## 5. UTILITIES & HELPERS

### Content Library (`src/lib/content.js`)

#### POSTS_PER_PAGE
Constant: `20` posts per page (pagination size)

#### getPage(items, page)
Returns paginated data:
```javascript
{
  items: [...],        // Slice of items for this page
  currentPage: 1,      // Validated current page number
  totalPages: 5        // Calculated total pages
}
```
- Validates page number (clamps to 1–totalPages)
- Calculates total pages as `Math.ceil(items.length / POSTS_PER_PAGE)`

#### getCategoryPosts(posts, categorySlug)
Filters posts by category slug:
```javascript
posts.filter(post =>
  (post.categories || []).some(cat => cat.slug === categorySlug)
)
```

#### pageUrl(basePath, page)
Generates canonical URL for pagination:
- Page 1: returns `basePath`
- Page 2+: returns `${basePath}${page}/`

---

## 6. STYLING & DESIGN

### CSS Architecture (`public/styles.css`)

**CSS Variables** (`:root`):
- `--ink`: `#29252a` (dark text)
- `--muted`: `#746d76` (secondary text)
- `--accent`: `#7a3b63` (link/button color)
- `--soft`: `#f7f1f5` (light backgrounds)
- `--line`: `#e5dfe3` (borders)

**Typography**:
- Font: Georgia, serif (body)
- System fonts: system-ui, sans-serif (headers, UI)
- Body line-height: 1.65
- Color: `--ink`

**Layout**:
- Max-width container: 1180px
- Side padding: 24px (desktop), 16px (mobile)
- Main has 48px top, 64px bottom padding

**Desktop Layout**:
- Two-column: content (1fr) + sidebar (220px), 64px gap
- Sidebar: sticky, left border, smaller fonts

**Mobile Layout** (max-width: 767px):
- Single column (no sidebar)
- Sidebar hidden
- Hamburger menu visible
- Reduced padding

**Key Classes**:

| Class | Purpose |
|-------|---------|
| `.site-header` | Sticky header (hide on scroll) |
| `.header-hidden` | Header slides up (transform) |
| `.post-card` | Single post in list view |
| `.post-meta` | Date stamp |
| `.post-excerpt` | Preview text |
| `.post-categories` | Category pill badges |
| `.post-content` | Full post HTML content area |
| `.pagination` | Page navigation grid |
| `.pagination-current` | Current page (highlighted) |
| `.pagination-disabled` | Disabled nav button |
| `.mobile-nav-panel` | Full-screen menu overlay |
| `.related-posts` | Related articles section |
| `.search-box` | Search input + button |
| `.global-search-results` | Search results container |

**Responsive Design**:
- Header: Sticky top, hides on scroll down
- Grid layout used for pagination (3-column grid for nav/pages/nav)
- Mobile: Flex column layout, hidden elements (display:none)
- Images in content: max-width 100%, auto height
- Tables: horizontal scroll on mobile

---

## 7. SEARCH & NAVIGATION

### Search Feature

**Index Generation** (`scripts/generate-search-index.mjs`)
- Runs at build time: `npm run build`
- Reads all `src/data/*.json` files
- Filters removed posts (same list as posts.js)
- Outputs: `public/search-index.json`
- Index format:
```json
{
  "slug": "post-slug",
  "title": "Post Title",
  "excerpt": "...",
  "date": "2024-01-08 09:32:17",
  "content": "All text (stripped HTML) for searching"
}
```

**Client-Side Search** (Layout.astro script)
- Fetches `/search-index.json` on first search
- Falls back to `window.FALLBACK_POSTS` (injected in Layout head)
- Searches across title, excerpt, content (case-insensitive)
- Minimum 3-character query
- Results paginated (10 per page with Astro-style pagination)

**Search Results Display**:
- Hides main content, shows results
- Results shown as post cards with links
- Pagination with smart page range
- Clear results by clearing input

### Navigation Structure

**Desktop Navigation**:
- Header: Site title (home link)
- Primary nav: "Toate postarile" link
- Sidebar: Category links

**Mobile Navigation**:
- Hamburger button in header
- Opens full-screen menu panel with:
  - "Toate postarile" link
  - All categories as links
  - Scrollable if content exceeds screen

**Category Links**:
- Desktop sidebar: `/category/{slug}/`
- Mobile menu: `/category/{slug}/`
- Categories list from `categories.json`

---

## 8. BUILD & DEPLOYMENT PROCESS

### Build Pipeline

1. **Generate Search Index** (manual or via build)
   ```bash
   node scripts/generate-search-index.mjs
   ```
   - Reads `src/data/*.json`
   - Writes `public/search-index.json`

2. **Astro Build**
   ```bash
   npx astro build
   ```
   - Generates static HTML pages in `dist/`
   - Copies public assets
   - Creates sitemaps (via @astrojs/sitemap)
   - Generates RSS feed

3. **Script `npm run build`**
   - Runs both steps above in sequence
   - Used in production (CI/CD)

### Local Development
```bash
npm run dev
```
- Starts Astro dev server (http://localhost:3000)
- Hot module reload on file changes
- No build required (on-the-fly)

### Local Production Preview
```bash
npm run build && npm run start
```
- Builds to `dist/`
- Serves `dist/` locally (via `scripts/start-serve.mjs`)
- Runs `astro preview` on port 4321

### Deployment

**Cloudflare Pages Configuration** (`wrangler.jsonc`)
- Project name: `imiasum-ro`
- Compatibility date: `2026-09-18`
- Build output directory: `./dist`
- Asset serving: Enabled
- Observability: Logs enabled (invocation + persistence)

**Deploy Process**:
1. Push to git repo (monitored by Cloudflare Pages)
2. Cloudflare runs: `npm run build`
3. Publishes `dist/` contents
4. Serves from Cloudflare CDN

**Build Command on Cloudflare**:
```
npm run build
```

**RSS Feed**
- Route: `/rss.xml`
- Generated by: `src/pages/rss.xml.js` (using @astrojs/rss)
- Includes: Latest 50 posts
- Format: XML RSS 2.0

**Sitemap**
- Route: `/sitemap.xml`
- Generated by: @astrojs/sitemap integration
- Includes: All pages (posts, categories, blog pages)

---

## 9. CONTENT MANAGEMENT

### Adding a Post

1. Create/update `src/data/{YEAR}.json`
2. Add post object (schema above)
3. Ensure slug is unique and URL-safe
4. Ensure date is valid
5. Reference existing categories from `categories.json`
6. Run `npm run build` to regenerate
7. Deploy

### Modifying Categories

1. Edit `src/data/categories.json`
2. Keep ID, name, slug, description, parent fields
3. Rebuild and deploy

### Excluding Posts

1. Add post ID to `removedPostIds` in both:
   - `src/data/posts.js`
   - `scripts/generate-search-index.mjs`
2. Keep in sync
3. Rebuild and deploy

---

## 10. KEY CONSTRAINTS & CONVENTIONS

- **Date Format**: ISO or MySQL datetime (parsed by JS `Date()`)
- **Slug Format**: lowercase, hyphens only, no spaces
- **Content**: HTML (supports inline styles, images, iframes)
- **Images**: Stored in `public/uploads/{YEAR}/{MONTH}/`
- **Image Paths**: Relative to `public/` (e.g., `/uploads/2024/01/image.jpg`)
- **Excerpt**: Optional, plain text or short HTML
- **Categories**: Must exist in `categories.json`, optional per post
- **Posts Sorting**: Always by date descending (newest first)
- **Pages per Pagination**: 20 posts per page (configurable in `content.js`)
- **Related Posts**: Always 3, from same sorted list
- **Language**: Romanian (ro) HTML lang attribute
- **Accessibility**: ARIA labels, semantic HTML, focus management

---

## 11. FILE STRUCTURE SUMMARY

```
src/
├── data/
│   ├── posts.js          (aggregator + filter)
│   ├── categories.json   (category definitions)
│   ├── 2016.json - 2024.json
├── layouts/
│   └── Layout.astro      (master layout, scripts, nav, search)
├── components/
│   ├── PostList.astro    (post grid component)
│   ├── PostPreviewCards.astro (related articles)
│   └── Pagination.astro  (page navigation)
├── lib/
│   └── content.js        (pagination + filtering utilities)
├── pages/
│   ├── index.astro       (home, 8 latest)
│   ├── [slug].astro      (individual post)
│   ├── 404.astro         (not found)
│   ├── blog/
│   │   ├── index.astro   (all posts, page 1)
│   │   └── [page].astro  (blog page 2+)
│   ├── category/
│   │   ├── [slug].astro  (category page 1)
│   │   └── [slug]/[page].astro (category page 2+)
│   ├── tag/              (empty, not in use)
│   └── rss.xml.js        (RSS feed)
public/
├── styles.css
├── favicon.svg
├── robots.txt
├── search-index.json     (generated at build)
├── uploads/              (images, organized by date)
scripts/
└── generate-search-index.mjs
```

---

**This documentation is complete and detailed enough to recreate the entire blog from scratch if needed.**

