# imiasum.ro

Auto-generated site for imiasum.ciuculescu.com

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

