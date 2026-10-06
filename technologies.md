# Technologies

This repository builds a static Romanian blog from locally stored post data.

## Site

- **Astro** builds the pages into static files. Page routes, layouts, and reusable components are written as `.astro` files under `src/`.
- **JavaScript (ES modules)** provides content helpers, browser interactions, RSS generation, and the Node.js scripts in `scripts/`.
- **HTML and CSS** make up the rendered pages and site styling. Styles are maintained in `public/styles.css`; browser-side scripts provide features such as search and theme selection.
- **JSON** stores posts by year and category metadata in `src/data/`. The build also creates `public/search-index.json` for the site's client-side search.

## Build and packages

- **Node.js and npm** run the project scripts and manage dependencies (`package.json` and `package-lock.json`).
- **Vite** is used through Astro's development server and build tooling. `astro.config.mjs` enables polling-based file watching for more reliable development on Windows.
- **`@astrojs/sitemap`** generates the site's sitemap during the Astro build.
- **`@astrojs/rss`** generates the RSS feed at `src/pages/rss.xml.js`.
- **TypeScript** is installed as a dependency, though the application source in this repository is JavaScript and Astro rather than standalone TypeScript files.
- **`live-server`** is available to serve the built `dist/` output in the fallback preview workflow.

The main build command is `npm run build`. It first regenerates the search index, then runs the Astro build through `scripts/build-and-copy.mjs`. The generated `dist/` directory can be published to Cloudflare Pages or another static host; the README also documents Wrangler deployment to Cloudflare Workers.

## Content migration utilities

The scripts under `scripts/` use Node.js ES modules to inspect WordPress SQL exports, transform exported content into the site's JSON data format, normalize slugs, and audit content and media references. WordPress is the source format for these migration utilities; the running site itself reads the generated local data files.
