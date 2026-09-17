export const POSTS_PER_PAGE = 20;

export function getPage(items, page = 1) {
  const totalPages = Math.max(1, Math.ceil(items.length / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  return { items: items.slice(start, start + POSTS_PER_PAGE), currentPage, totalPages };
}

export function getCategoryPosts(posts, categorySlug) {
  return posts.filter((post) =>
    (post.categories || []).some((category) => category.slug === categorySlug)
  );
}

export function pageUrl(basePath, page) {
  return page === 1 ? basePath : `${basePath}${page}/`;
}
