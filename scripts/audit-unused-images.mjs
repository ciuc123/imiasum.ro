#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_UPLOADS = path.join(ROOT_DIR, 'public', 'uploads');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// ============================================================================
// STEP 1: Inventory all images on disk
// ============================================================================
function getAllImagesOnDisk(dir) {
  const images = [];

  function walk(currentPath, relativePath = '') {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm)$/i.test(entry.name)) {
        images.push({
          filename: entry.name,
          relativePath: relPath,
          fullPath: fullPath,
          size: fs.statSync(fullPath).size
        });
      }
    }
  }

  walk(dir);
  return images;
}

// ============================================================================
// STEP 2: Extract image references from published posts
// ============================================================================
function getReferencedImagesFromPosts() {
  const referenced = new Set();
  const dataDir = path.join(SRC_DIR, 'data');

  // Load all year JSON files
  const yearFiles = fs.readdirSync(dataDir).filter(f => /^\d{4}\.json$/.test(f));

  for (const file of yearFiles) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const posts = JSON.parse(content);

    for (const post of posts) {
      if (post.content) {
        // Extract all image src paths
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(post.content)) !== null) {
          referenced.add(match[1]);
        }
      }
    }
  }

  return referenced;
}

// ============================================================================
// STEP 3: Load removed post IDs and their images
// ============================================================================
function getFilteredPostImages() {
  const filtered = new Set();
  const removedPostIds = new Set([4589, 4601, 4618, 4650, 4668, 4682]);
  const dataDir = path.join(SRC_DIR, 'data');
  const yearFiles = fs.readdirSync(dataDir).filter(f => /^\d{4}\.json$/.test(f));

  for (const file of yearFiles) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const posts = JSON.parse(content);

    for (const post of posts) {
      if (removedPostIds.has(post.id) && post.content) {
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(post.content)) !== null) {
          filtered.add(match[1]);
        }
      }
    }
  }

  return filtered;
}

// ============================================================================
// STEP 4: Search for image references throughout codebase
// ============================================================================
function searchCodebaseForImageReferences(allImageFilenames) {
  const referenced = new Set();
  const codebaseReferences = new Map(); // filename => [files that reference it]

  // Prepare to search: extract just filenames
  const imageFilenamesOnly = new Set(
    allImageFilenames.map(img => img.filename)
  );

  // Search directories
  const searchDirs = [
    { path: SRC_DIR, pattern: /\.(astro|js|jsx|ts|tsx|css)$/ },
    { path: SCRIPTS_DIR, pattern: /\.mjs$/ },
    { path: DOCS_DIR, pattern: /\.md$/ },
    { path: ROOT_DIR, pattern: /\.(mjs|json|config)$/ }
  ];

  for (const { path: dirPath, pattern } of searchDirs) {
    if (!fs.existsSync(dirPath)) continue;

    function walk(currentPath) {
      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip node_modules, dist, .git, etc.
          if (['node_modules', 'dist', '.git', '.astro'].includes(entry.name)) continue;

          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (pattern.test(entry.name)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');

              // Search for each image filename in this file
              for (const filename of imageFilenamesOnly) {
                if (content.includes(filename)) {
                  referenced.add(filename);

                  if (!codebaseReferences.has(filename)) {
                    codebaseReferences.set(filename, []);
                  }
                  codebaseReferences.get(filename).push(path.relative(ROOT_DIR, fullPath));
                }
              }
            } catch (err) {
              // Skip files that can't be read
            }
          }
        }
      } catch (err) {
        // Skip directories that can't be read
      }
    }

    walk(dirPath);
  }

  return { referenced, codebaseReferences };
}

// ============================================================================
// STEP 5: Main audit function
// ============================================================================
function auditUnusedImages() {
  console.log('\n========================================');
  console.log('IMAGE AUDIT REPORT');
  console.log('========================================\n');

  // Step 1: Get all images on disk
  console.log('📦 Scanning disk for images...');
  const allImages = getAllImagesOnDisk(PUBLIC_UPLOADS);
  console.log(`   Found ${allImages.length} total images on disk\n`);

  // Step 2: Get referenced images from posts
  console.log('📄 Extracting images from published posts...');
  const postReferences = getReferencedImagesFromPosts();
  console.log(`   Found ${postReferences.size} image references in published posts\n`);

  // Step 3: Get filtered post images
  console.log('🔒 Extracting images from intentionally filtered posts...');
  const filteredReferences = getFilteredPostImages();
  console.log(`   Found ${filteredReferences.size} image references in filtered posts\n`);

  // Step 4: Search codebase
  console.log('🔍 Searching codebase for image filename references...');
  const { referenced: codebaseReferenced, codebaseReferences } = searchCodebaseForImageReferences(allImages);
  console.log(`   Found ${codebaseReferenced.size} unique images referenced in codebase\n`);

  // Step 5: Categorize images
  const inUseByPost = [];
  const inUseByCodebase = [];
  const inFilteredPosts = [];
  const completelyUnused = [];
  const inUseByBoth = new Set();

  for (const img of allImages) {
    const inPost = postReferences.has(`/uploads/${img.relativePath.replace(/\\/g, '/')}`);
    const inFiltered = filteredReferences.has(`/uploads/${img.relativePath.replace(/\\/g, '/')}`);
    const inCode = codebaseReferenced.has(img.filename);

    if (inCode) {
      inUseByCodebase.push(img);
      inUseByBoth.add(img.filename);
    }

    if (inPost) {
      inUseByPost.push(img);
      inUseByBoth.add(img.filename);
    } else if (inFiltered) {
      inFilteredPosts.push(img);
      inUseByBoth.add(img.filename);
    } else if (!inCode) {
      completelyUnused.push(img);
    }
  }

  // ========================================================================
  // Generate Report
  // ========================================================================

  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  console.log(`✅ Total images on disk:              ${allImages.length}`);
  console.log(`   - Used in published posts:        ${inUseByPost.length}`);
  console.log(`   - Used in filtered posts:         ${inFilteredPosts.length}`);
  console.log(`   - Referenced in codebase:         ${inUseByCodebase.length}`);
  console.log(`   - Used in both posts & code:      ${inUseByBoth.size}`);
  console.log(`❌ Completely unused:                ${completelyUnused.length}`);
  console.log(`\n💾 Safe to delete:                   ${completelyUnused.length} (${Math.round(completelyUnused.length / allImages.length * 100)}%)\n`);

  // ========================================================================
  // Detailed Breakdown: Images used in Published Posts
  // ========================================================================
  console.log('========================================');
  console.log('PUBLISHED POST IMAGES (In Use)');
  console.log('========================================\n');

  const postsByYear = {};
  for (const img of inUseByPost) {
    const match = img.relativePath.match(/^(\d{4})\//);
    const year = match ? match[1] : 'unknown';
    if (!postsByYear[year]) postsByYear[year] = [];
    postsByYear[year].push(img);
  }

  for (const year of Object.keys(postsByYear).sort()) {
    console.log(`${year}: ${postsByYear[year].length} images`);
  }
  console.log('');

  // ========================================================================
  // Detailed Breakdown: Completely Unused Images
  // ========================================================================
  if (completelyUnused.length > 0) {
    console.log('========================================');
    console.log(`UNUSED IMAGES (${completelyUnused.length} total - SAFE TO DELETE)`);
    console.log('========================================\n');

    const unusedByYear = {};
    for (const img of completelyUnused) {
      const match = img.relativePath.match(/^(\d{4})\//);
      const year = match ? match[1] : 'unknown';
      if (!unusedByYear[year]) unusedByYear[year] = [];
      unusedByYear[year].push(img);
    }

    for (const year of Object.keys(unusedByYear).sort()) {
      const yearImages = unusedByYear[year];
      console.log(`\n📅 ${year}: ${yearImages.length} unused images`);
      console.log('   ' + '-'.repeat(60));

      for (const img of yearImages.slice(0, 10)) {
        const sizeKB = (img.size / 1024).toFixed(1);
        console.log(`   ${img.filename} (${sizeKB} KB)`);
      }

      if (yearImages.length > 10) {
        console.log(`   ... and ${yearImages.length - 10} more images`);
      }
    }
    console.log('\n');
  }

  // ========================================================================
  // Detailed Breakdown: Images in Filtered Posts
  // ========================================================================
  if (inFilteredPosts.length > 0) {
    console.log('========================================');
    console.log(`FILTERED POST IMAGES (${inFilteredPosts.length} - PRESERVE FOR NOW)`);
    console.log('========================================\n');
    console.log('These images are in posts that are intentionally filtered out.');
    console.log('Preserve them in case these posts are re-enabled in the future.\n');

    for (const img of inFilteredPosts) {
      const sizeKB = (img.size / 1024).toFixed(1);
      console.log(`   ${img.relativePath} (${sizeKB} KB)`);
    }
    console.log('\n');
  }

  // ========================================================================
  // Detailed Breakdown: Images Referenced in Codebase
  // ========================================================================
  if (inUseByCodebase.length > 0) {
    console.log('========================================');
    console.log(`CODEBASE REFERENCES (${inUseByCodebase.length} images referenced in code/config)`);
    console.log('========================================\n');

    for (const img of inUseByCodebase.sort((a, b) => a.filename.localeCompare(b.filename))) {
      const refs = codebaseReferences.get(img.filename) || [];
      console.log(`📌 ${img.filename}`);
      for (const ref of refs) {
        console.log(`   └─ ${ref}`);
      }
    }
    console.log('\n');
  }

  // ========================================================================
  // Space Analysis
  // ========================================================================
  const totalSizeBytes = allImages.reduce((sum, img) => sum + img.size, 0);
  const usedSizeBytes = inUseByPost.reduce((sum, img) => sum + img.size, 0) +
                        inFilteredPosts.reduce((sum, img) => sum + img.size, 0) +
                        inUseByCodebase.reduce((sum, img) => sum + img.size, 0);
  const unusedSizeBytes = completelyUnused.reduce((sum, img) => sum + img.size, 0);

  console.log('========================================');
  console.log('STORAGE ANALYSIS');
  console.log('========================================\n');

  console.log(`Total storage used by images:     ${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Storage used by active images:   ${(usedSizeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Storage used by unused images:   ${(unusedSizeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Potential savings (${completelyUnused.length} files): ${(unusedSizeBytes / 1024 / 1024).toFixed(2)} MB (${Math.round(unusedSizeBytes / totalSizeBytes * 100)}%)\n`);

  // ========================================================================
  // Recommendations
  // ========================================================================
  console.log('========================================');
  console.log('RECOMMENDATIONS');
  console.log('========================================\n');

  console.log('✅ DO DELETE (completely unused):');
  console.log(`   ${completelyUnused.length} images can be safely deleted`);
  console.log(`   Potential savings: ${(unusedSizeBytes / 1024 / 1024).toFixed(2)} MB\n`);

  console.log('⚠️  DO NOT DELETE (still in use):');
  console.log(`   - ${inUseByPost.length} images in published posts`);
  console.log(`   - ${inFilteredPosts.length} images in filtered posts (preserve for re-enablement)`);
  console.log(`   - ${inUseByCodebase.length} images referenced in codebase\n`);

  console.log('🛡️  SAFE DELETION STRATEGY:');
  console.log('   1. Create backup: mv public/uploads public/uploads.backup');
  console.log('   2. Run this script again to generate deletion list');
  console.log('   3. Manually verify the unused images list');
  console.log('   4. Delete unused images or entire unused folders');
  console.log('   5. Run build & test to ensure no breakage');
  console.log('   6. Remove backup once confident\n');

  // Save results to JSON for further processing
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalImages: allImages.length,
      usedInPosts: inUseByPost.length,
      usedInFilteredPosts: inFilteredPosts.length,
      usedInCodebase: inUseByCodebase.length,
      completelyUnused: completelyUnused.length,
      totalStorageMB: (totalSizeBytes / 1024 / 1024).toFixed(2),
      unusedStorageMB: (unusedSizeBytes / 1024 / 1024).toFixed(2)
    },
    unusedImages: completelyUnused.map(img => ({
      filename: img.filename,
      relativePath: img.relativePath,
      sizeKB: (img.size / 1024).toFixed(1)
    }))
  };

  const reportPath = path.join(ROOT_DIR, 'image-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📊 Detailed report saved to: image-audit-report.json\n`);
}

// Run the audit
auditUnusedImages();

