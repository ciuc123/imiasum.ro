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
