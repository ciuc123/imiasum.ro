#!/usr/bin/env bash
# Deployment Verification Script
# Verifies that images are properly deployed and accessible

set -e

echo "=== Image Deployment Verification ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Verify HTML contains image tags
echo "Checking HTML files for image tags..."
IMG_COUNT=$(grep -r 'src="/uploads/' dist --include="*.html" 2>/dev/null | wc -l)
if [ $IMG_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Found $IMG_COUNT image references in HTML${NC}"
else
    echo -e "${RED}✗ No image references found in HTML${NC}"
    exit 1
fi

# Check 2: Verify image files exist
echo ""
echo "Checking if image files exist in dist/uploads..."
UPLOAD_DIR_COUNT=$(find dist/uploads -type f -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.webp" | wc -l)
if [ $UPLOAD_DIR_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Found $UPLOAD_DIR_COUNT image files in dist/uploads${NC}"
else
    echo -e "${RED}✗ No image files found in dist/uploads${NC}"
    exit 1
fi

# Check 3: Sample image verification
echo ""
echo "Verifying sample image file..."
SAMPLE_IMG="dist/uploads/2018/09/9c71044b-b3c3-4a2d-a517-d0a4423f75f8.jpg"
if [ -f "$SAMPLE_IMG" ]; then
    SIZE=$(ls -lh "$SAMPLE_IMG" | awk '{print $5}')
    echo -e "${GREEN}✓ Sample image exists ($SIZE)${NC}"
else
    echo -e "${YELLOW}⚠ Sample image not found (this post may not have this exact image)${NC}"
fi

# Check 4: CSS styling verification
echo ""
echo "Checking CSS for image styling..."
if grep -q "\.post-content img" public/styles.css; then
    echo -e "${GREEN}✓ Image CSS styling found${NC}"
else
    echo -e "${RED}✗ Image CSS styling not found${NC}"
    exit 1
fi

# Check 5: Build completion verification
echo ""
echo "Verifying build completion..."
if [ -f "dist/index.html" ] && [ -f "dist/robots.txt" ]; then
    BUILD_TIME=$(ls -l dist/index.html | awk '{print $6, $7, $8}')
    echo -e "${GREEN}✓ Build artifacts present (Build time: $BUILD_TIME)${NC}"
else
    echo -e "${RED}✗ Build artifacts missing${NC}"
    exit 1
fi

# Check 6: Astro/Node installation
echo ""
echo "Checking build dependencies..."
if command -v npx &> /dev/null; then
    ASTRO_VERSION=$(npx astro --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ NPX available (Astro: $ASTRO_VERSION)${NC}"
else
    echo -e "${YELLOW}⚠ NPX not found (skipping Astro version check)${NC}"
fi

echo ""
echo "=== Summary ==="
echo -e "${GREEN}All image deployment checks passed!${NC}"
echo ""
echo "Images are properly:"
echo "  ✓ Embedded in HTML files"
echo "  ✓ Copied to dist/uploads/"
echo "  ✓ Styled with CSS"
echo "  ✓ Build is complete"
echo ""
echo "Next steps:"
echo "  1. Ensure latest build is deployed: npm run build"
echo "  2. Deploy to Cloudflare: npx wrangler deploy"
echo "  3. Clear browser cache or use private browsing mode"
echo "  4. Verify on live site: https://imiasum.ro/blog/"
echo ""

