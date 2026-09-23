# imiasum.ro

Auto-generated site for imiasum.ciuculescu.com

## Quick start — minimum commands

Use the commands below as the minimal actions required to run the project in
each environment.

- Local development (hot-reload):

```bash
npm run dev
```

- Local production preview (build and serve the built `dist/`):

```bash
npm run build && npm run start
```

- Production (Cloudflare Pages or other static host):

Set the build command to:

```bash
npm run build
```

The deployment platform will run `npm run build` and publish the generated
`dist/` output. (No `npm run start` is required on the production host.)

- Cloudflare Workers deployment (using Wrangler):

```bash
npx wrangler deploy            # creates/updates imiasum-ro (production)
npx wrangler deploy --env dev  # creates/updates imiasum-ro-dev (dev)
```



## Scripts

This repository includes a set of utility scripts (in `scripts/`) used to
inspect WordPress SQL exports, generate cleaned JSON content for the site,
normalize data, build the site, and serve the built output. All scripts are
ES modules (`.mjs`) and can be run with your installed Node.js (e.g.
`node scripts/<script>.mjs ...`) or via `npx`.

Common usage examples:

```bash
# parse an SQL dump: node scripts/analyze-comments.mjs path/to/imiasum.sql
# generate cleaned JSON data from a SQL dump: node scripts/generate-clean-data.mjs path/to/imiasum.sql
# normalize decoded slugs in src/data before building: node scripts/normalize-data.mjs
# build and copy site output: node scripts/build-and-copy.mjs
# serve dist/ (uses `astro preview` if this is an Astro project): node scripts/start-serve.mjs
```

Scripts and brief descriptions:

- `analyze-comments.mjs`
  - Parse `wp_comments` INSERTs from a MySQL dump and produce summaries
	(counts, by-year, pingbacks, XML-RPC entries, X-* URLs, IP activity).

- `analyze-post-authors.mjs`
  - Parse published `wp_posts` and summarize posts by author ID. Prints
	posts from suspicious/non-legitimate authors (IDs >= 27) and lists
	posts by legitimate authors.

- `analyze-published-content.mjs`
  - Parse `wp_posts` and report published content by type (post, page, media,
	etc.), list published pages, non-post content and posts with suspicious
	recent dates.

- `analyze-user-meta.mjs`
  - Inspect `wp_users` / `wp_usermeta` INSERTs, identify users with IDs >= 27
	and collect capability/user-level metadata for review.

- `analyze-users.mjs`
  - Print basic `wp_users` rows (ID, username, email, registered date,
	display name) and selected capability/user-level entries from
	`wp_usermeta`.

- `build-and-copy.mjs`
  - Build the site. If an Astro project is detected (`astro.config.mjs` or
	`src/` present) this script runs `npx astro build`. Otherwise it performs a
	simple build by copying `index.html`, `styles.css`, `CNAME` and the
	`public/` directory into `dist/`.
  - Set `FORCE_SIMPLE_BUILD=1` to force the simple copy-based build.

- `find-x-urls.mjs`
  - Scan an SQL dump for occurrences of the `/x` (and `/x-<n>`) URL patterns
	and prints context and the originating table.

- `generate-clean-data.mjs`
  - Parse a WordPress SQL dump and generate cleaned JSON files under
	`src/data/` (posts split by year and a `categories.json`). This is the
	main migration script that extracts posts, categories and normalizes
	content paths.

- `normalize-data.mjs`
  - Normalize slugs in `src/data/*.json` by decoding percent-encoded slugs
	(runs `decodeURIComponent` and writes back modified year files). Useful
	to make slug values canonical before building.

- `scan-published-post-content.mjs`
  - Scan published post content inside a SQL dump for suspicious HTML/PHP
	patterns (script tags, iframes, eval(), meta refresh redirects, etc.)
	and lists posts containing external iframes.

- `start-serve.mjs`
  - Serve the `dist/` directory. If Astro is present, runs
	`npx astro preview --port=4321`, otherwise runs `npx live-server dist` on
	port `4321`.

If you need help running a specific script or want the README expanded with
examples for a particular workflow (e.g. migrate from a SQL dump to a local
preview), open an issue or ask for more details and I can add step-by-step
instructions.


## Adding a New Post

To add a new post to the blog:

### 1. Add post data to the appropriate year file

Posts are organized by year in `src/data/`. For example, to add a 2026 post:

1. Open or create `src/data/2026.json` (if the file doesn't exist)
2. Add a post object to the array:

```json
{
  "slug": "my-new-post",
  "title": "My New Post Title",
  "date": "2026-09-22",
  "excerpt": "Brief summary of the post...",
  "content": "<p>HTML content of the post...</p>",
  "categories": [
    {
      "slug": "category-slug",
      "name": "Category Name"
    }
  ]
}
```

### 2. Ensure data consistency

- **slug**: URL-safe identifier (lowercase, hyphens only, no spaces)
- **date**: ISO format (YYYY-MM-DD)
- **content**: HTML (can include inline styles, images with paths like `public/uploads/2026/09/image.jpg`)
- **categories**: Reference existing categories from `src/data/categories.json`, or the post will have no categories

### 3. Build and test locally

```bash
npm run dev
```

Then navigate to `http://localhost:3000/my-new-post/` to view the post.

The blog index will automatically include the new post in the correct chronological position.

### 4. Deploy

```bash
npm run build
```

This will:
- Generate the static site in `dist/`
- Regenerate `public/search-index.json` (includes your new post in search)
- Create the new post page and update blog indexes/pagination

Push to your deployment branch (e.g., `main` or `development` for Cloudflare Pages).


