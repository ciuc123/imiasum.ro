# imiasum.ro — Migration Checklist

## 1. Content & Data

- [x] Import 356 legitimate published posts
- [x] Exclude attacker posts
- [x] Import categories
- [x] Copy media to public/uploads
- [x] Verify referenced media exists
- [x] Normalize same-domain upload URLs
- [ ] Recover ????-corrupted content from older backup (later)
- [ ] Optional: Unicode NFC normalization
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
- [ ] Add redirects where necessary

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

- [ ] Configure no build command
- [ ] Configure root output directory
- [x] Commit and push coming-soon page
- [x] Attach imiasum.ro
- [x] Deploy and test coming-soon page

### development

- [x] Connect development branch deployment
- [x] Build command: npm run build
- [x] Output directory: dist
- [ ] Attach development.imiasum.ro
- [x] Deploy preview
- [x] Test homepage
- [ ] Test blog pagination
- [ ] Test category pages
- [ ] Test several old posts
- [ ] Test images/media
- [ ] Test mobile

## 6. DNS Cutover

- [x] Verify imiasum.ro points to the Cloudflare Pages deployment
- [x] Configure https://imiasum.ro/
- [x] Verify https://development-imiasum-ro.andrei-eab.workers.dev/
- [x] Verify HTTPS
- [ ] Verify old post URLs
- [ ] Verify sitemap
- [ ] Verify RSS
- [ ] Monitor site for a few days

## 7. AWS / WordPress Cleanup

- [ ] Preserve original SQL backup
- [ ] Preserve BackWPup archives
- [ ] Preserve security/backdoor evidence
- [x] Remove WordPress EC2
- [x] Remove RDS/database resources if unused
- [ ] Remove unused S3 resources
- [x] Remove unused security groups/load balancers
- [x] Check AWS resources for anything remaining
- [x] Check AWS billing

———

## Current Next Steps

- [x] Commit and push the main coming-soon page
- [x] Configure Cloudflare Pages for main
- [x] Configure the development branch deployment
- [x] Attach imiasum.ro and development.imiasum.ro
- [x] Verify DNS propagation and HTTPS
- [ ] Consider Unicode normalization
- [x] AWS cleanup only after both deployments are confirmed stable

---

## Notes: deploying Astro to production

When the `main` branch is replaced with a full Astro site, update CI / Cloudflare settings and `package.json` as follows:

- package.json: ensure `build` runs `astro build` and the publish directory matches Astro's output (default: `dist`). Example:

  "scripts": {
    "build": "astro build",
    "start": "astro preview --port=4321"
  }

- If you keep the simple coming-soon `main` and an Astro `development` branch, the repo now includes `scripts/build-and-copy.mjs` which auto-detects Astro and either runs `astro build` or performs the simple copy build used by the current `main` branch. This lets `npm run start` (which runs `npm run build` first) behave the same on either branch.

- Cloudflare Pages (static): set the build command to `npm run build` and the publish directory to `dist`. No adapter required for Pages — just publish the built static files.

- Cloudflare Workers (if you want dynamic Workers deployment): install the `@astrojs/cloudflare` adapter and follow the adapter instructions (update `astro.config.mjs`, add `wrangler`/`wrangler.toml`, and set the Pages/Worker build step to run `npm run build` and upload/serve the `dist` output or use the adapter to produce a Worker bundle).

- CI / production notes: remove `live-server` from production installs (it's only a devDependency used for local testing). Use `astro preview` or your platform's preview server for verifying builds in CI.

Keep this note as a reference when moving the production site to Astro.

