import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDataDir = path.join(rootDir, 'src', 'data');
const distDir = path.join(rootDir, 'dist');

// Extract all img tags from HTML content
function extractImagesFromContent(content) {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  const images = [];
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  return images;
}

// Main verification
async function verifyAllImages() {
  console.log('🔍 Starting comprehensive image verification...\n');

  const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
  // Posts that are intentionally removed/filtered (from src/data/posts.js)
  const removedPostIds = new Set([4589, 4601, 4618, 4650, 4668, 4682]);

  const allPosts = [];
  const filteredOutPosts = [];
  let totalExpectedImages = 0;
  let totalFoundImages = 0;
  const issues = [];

  // STEP 1: Load all posts and extract expected images
  console.log('📋 STEP 1: Loading all posts from JSON files...\n');

  for (const year of years) {
    const jsonPath = path.join(srcDataDir, `${year}.json`);
    try {
      const content = await fs.readFile(jsonPath, 'utf-8');
      const posts = JSON.parse(content);

      for (const post of posts) {
        // Skip posts that are in the removed list
        if (removedPostIds.has(post.id)) {
          const images = extractImagesFromContent(post.content);
          if (images.length > 0) {
            filteredOutPosts.push({
              year,
              id: post.id,
              slug: post.slug,
              title: post.title,
              images: images.length
            });
          }
          continue;
        }

        const images = extractImagesFromContent(post.content);
        if (images.length > 0) {
          allPosts.push({
            year,
            id: post.id,
            slug: post.slug,
            title: post.title,
            expectedImages: images,
            htmlPath: path.join(distDir, post.slug, 'index.html')
          });
          totalExpectedImages += images.length;
        }
      }
    } catch (err) {
      console.error(`❌ Error reading ${year}.json:`, err.message);
    }
  }

  console.log(`✓ Found ${allPosts.length} posts with images`);
  console.log(`✓ Total expected images: ${totalExpectedImages}\n`);

  // STEP 2: For each post, check if images are in generated HTML
  console.log('🔎 STEP 2: Verifying images in generated HTML files...\n');

  for (const post of allPosts) {
    try {
      const htmlContent = await fs.readFile(post.htmlPath, 'utf-8');
      const foundImages = extractImagesFromContent(htmlContent);

      // Compare
      const missing = post.expectedImages.filter(img => !foundImages.includes(img));
      const extra = foundImages.filter(img => !post.expectedImages.includes(img));

      if (missing.length > 0) {
        issues.push({
          type: 'MISSING',
          post: post.slug,
          images: missing
        });
        console.log(`⚠️  ${post.slug}: Missing ${missing.length} image(s)`);
        missing.forEach(img => console.log(`    - ${img}`));
      } else if (foundImages.length === post.expectedImages.length) {
        console.log(`✅ ${post.slug}: All ${post.expectedImages.length} images found`);
        totalFoundImages += post.expectedImages.length;
      }
    } catch (err) {
      issues.push({
        type: 'HTML_NOT_FOUND',
        post: post.slug,
        error: err.message
      });
      console.log(`❌ ${post.slug}: HTML file not found at ${post.htmlPath}`);
    }
  }

  // STEP 3: Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`Total posts in source JSON: ${allPosts.length + filteredOutPosts.length}`);
  console.log(`Posts filtered out (intentionally removed): ${filteredOutPosts.length}`);
  if (filteredOutPosts.length > 0) {
    console.log(`  Filtered posts:`);
    filteredOutPosts.forEach(p => {
      console.log(`    - ${p.slug} (ID: ${p.id}) - ${p.images} image(s)`);
    });
  }
  console.log('');
  console.log(`Published posts with images: ${allPosts.length}`);
  console.log(`Total expected images: ${totalExpectedImages}`);
  console.log(`Total verified images: ${totalFoundImages}`);
  console.log(`Verification rate: ${((totalFoundImages / totalExpectedImages) * 100).toFixed(2)}%`);
  console.log('');

  if (issues.length === 0) {
    console.log('✅ SUCCESS: All images are properly included in their published posts!');
  } else {
    console.log(`⚠️  ISSUES FOUND: ${issues.length}`);
    console.log('');
    issues.forEach(issue => {
      console.log(`  Post: ${issue.post}`);
      console.log(`  Issue: ${issue.type}`);
      if (issue.images) {
        console.log(`  Missing images:`);
        issue.images.forEach(img => console.log(`    - ${img}`));
      }
      if (issue.error) {
        console.log(`  Error: ${issue.error}`);
      }
      console.log('');
    });
  }

  console.log('='.repeat(60));
  return issues.length === 0;
}

// Run
verifyAllImages().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});




