# BLOG Smoke Tests

## Unicode slug build (WP-BLOG-03)
1. Create/publish a post with a Unicode slug (예: `한글-슬러그`).
2. Run the blog build and confirm it succeeds without errors.
3. Verify `dist/한글-슬러그/index.html` exists.
4. Open the homepage and posts list to confirm the post link navigates correctly.
5. Check `dist/sitemap.xml` contains the Unicode slug URL.
