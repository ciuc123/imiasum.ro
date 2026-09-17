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
- [ ] Commit and push coming-soon page
- [ ] Attach imiasum.ro
- [ ] Deploy and test coming-soon page

### development

- [ ] Connect development branch deployment
- [x] Build command: npm run build
- [x] Output directory: dist
- [ ] Attach development.imiasum.ro
- [ ] Deploy preview
- [ ] Test homepage
- [ ] Test blog pagination
- [ ] Test category pages
- [ ] Test several old posts
- [ ] Test images/media
- [ ] Test mobile

## 6. DNS Cutover

- [ ] Verify imiasum.ro points to the Cloudflare Pages deployment
- [ ] Configure www.imiasum.ro
- [ ] Verify development.imiasum.ro
- [ ] Verify HTTPS
- [ ] Verify old post URLs
- [ ] Verify sitemap
- [ ] Verify RSS
- [ ] Monitor site for a few days

## 7. AWS / WordPress Cleanup

- [ ] Preserve original SQL backup
- [ ] Preserve BackWPup archives
- [ ] Preserve security/backdoor evidence
- [ ] Remove WordPress EC2
- [ ] Remove RDS/database resources if unused
- [ ] Remove unused S3 resources
- [ ] Remove unused security groups/load balancers
- [ ] Check AWS resources for anything remaining
- [ ] Check AWS billing

———

## Current Next Steps

- [ ] Commit and push the main coming-soon page
- [ ] Configure Cloudflare Pages for main
- [ ] Configure the development branch deployment
- [ ] Attach imiasum.ro and development.imiasum.ro
- [ ] Verify DNS propagation and HTTPS
- [ ] Consider Unicode normalization
- [ ] AWS cleanup only after both deployments are confirmed stable
