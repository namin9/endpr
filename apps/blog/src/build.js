import { readFile, rm, mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PAGE_SIZE = 10;
const RESERVED_SLUGS = [
  "posts",
  "category",
  "tag",
  "search",
  "assets",
  "api",
  "cms",
  "sitemap.xml",
  "robots.txt",
];

const siteBaseUrl =
  (process.env.SITE_BASE_URL ||
    process.env.PUBLIC_SITE_BASE ||
    "https://example.com").replace(/\/$/, "");

function assertSlugAllowed(slug, entityType) {
  const normalized = `${slug}`.toLowerCase();
  if (RESERVED_SLUGS.includes(normalized)) {
    throw new Error(
      `Reserved slug "${slug}" detected for ${entityType}. ` +
        "Adjust the slug in the source data or skip this entry before building."
    );
  }
}

async function fetchJson(url, buildToken) {
  const response = await fetch(url, {
    headers: { "x-build-token": buildToken },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed for ${url}: ${response.status} ${text}`);
  }
  return response.json();
}

async function loadBuildData({ apiBase, buildToken, useMock }) {
  if (useMock) {
    const mockPath = path.resolve(
      ROOT_DIR,
      process.env.MOCK_BUILD_DATA_PATH || "./fixtures/sample.json"
    );
    const raw = await readFile(mockPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      posts: parsed.posts || [],
      categories: parsed.categories || [],
    };
  }

  const postsIndex = await fetchJson(`${apiBase}/build/posts`, buildToken);
  const categories = await fetchJson(`${apiBase}/build/categories`, buildToken);

  const posts = await Promise.all(
    postsIndex.map(async (post) => {
      if (post.body_html || post.body_md) return post;
      const detail = await fetchJson(
        `${apiBase}/build/post/${encodeURIComponent(post.slug)}`,
        buildToken
      );
      return { ...post, ...detail };
    })
  );

  return { posts, categories };
}

async function resetDist() {
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
}

function escapeHtml(value) {
  return `${value}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdown(md = "") {
  const safe = escapeHtml(md);
  const paragraphs = safe.trim().split(/\n{2,}/);
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`).join("\n");
}

function renderPostBody(post) {
  if (post.body_html) return post.body_html;
  if (post.body_md) return renderMarkdown(post.body_md);
  if (post.body) return renderMarkdown(post.body);
  return "<p></p>";
}

function layoutHtml({ title, content, description = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <nav>
      <a href="/posts/page/1/">Posts</a>
    </nav>
  </header>
  <main>
    ${content}
  </main>
</body>
</html>`;
}

async function writeHtml(filePath, html) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, html, "utf8");
}

function paginate(items, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return Array.from({ length: totalPages }, (_, index) => {
    const start = index * pageSize;
    const end = start + pageSize;
    return {
      page: index + 1,
      totalPages,
      items: items.slice(start, end),
    };
  });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function generatePostPages(posts) {
  for (const post of posts) {
    assertSlugAllowed(post.slug, "post");
    const html = layoutHtml({
      title: post.title || post.slug,
      description: post.excerpt || "",
      content: `<article>
  <h2>${escapeHtml(post.title || post.slug)}</h2>
  <p>${escapeHtml(post.excerpt || "")}</p>
  ${renderPostBody(post)}
</article>`,
    });

    const filePath = path.join(DIST_DIR, post.slug, "index.html");
    await writeHtml(filePath, html);
  }
}

async function generatePostListPages(posts) {
  const pages = paginate(posts, PAGE_SIZE);
  for (const page of pages) {
    const entries = page.items
      .map(
        (post) =>
          `<li><a href="/${post.slug}/">${escapeHtml(
            post.title || post.slug
          )}</a> <small>${escapeHtml(post.excerpt || "")}</small></li>`
      )
      .join("\n");

    const html = layoutHtml({
      title: `Posts — Page ${page.page}`,
      content: `<ol start="${(page.page - 1) * PAGE_SIZE + 1}">
${entries}
</ol>
<p>Page ${page.page} of ${page.totalPages}</p>`,
    });

    const filePath = path.join(
      DIST_DIR,
      "posts",
      "page",
      String(page.page),
      "index.html"
    );
    await writeHtml(filePath, html);
  }
}

async function generateCategoryPages(posts, categories) {
  const enabledCategories = categories.filter(
    (category) => category.enabled !== false
  );

  for (const category of enabledCategories) {
    assertSlugAllowed(category.slug, "category");
    const filtered = posts.filter(
      (post) => post.category_slug === category.slug
    );
    const pages = paginate(filtered, PAGE_SIZE);
    for (const page of pages) {
      const entries = page.items
        .map(
          (post) =>
            `<li><a href="/${post.slug}/">${escapeHtml(
              post.title || post.slug
            )}</a></li>`
        )
        .join("\n");

      const html = layoutHtml({
        title: `${escapeHtml(category.name || category.slug)} — Page ${
          page.page
        }`,
        content: `<h2>${escapeHtml(category.name || category.slug)}</h2>
<ul>
${entries}
</ul>
<p>Page ${page.page} of ${page.totalPages}</p>`,
      });

      const filePath = path.join(
        DIST_DIR,
        "category",
        category.slug,
        "page",
        String(page.page),
        "index.html"
      );
      await writeHtml(filePath, html);
    }
  }
}

async function generateRobots() {
  const content = `User-agent: *
Allow: /
Sitemap: ${siteBaseUrl}/sitemap.xml
`;
  await writeHtml(path.join(DIST_DIR, "robots.txt"), content);
}

async function generateSitemap(posts, categories) {
  const urls = [];
  for (const post of posts) {
    urls.push({
      loc: `${siteBaseUrl}/${post.slug}/`,
      lastmod: formatDate(post.published_at || post.updated_at),
    });
  }

  const postPages = paginate(posts, PAGE_SIZE);
  for (const page of postPages) {
    urls.push({
      loc: `${siteBaseUrl}/posts/page/${page.page}/`,
      lastmod: formatDate(),
    });
  }

  const enabledCategories = categories.filter(
    (category) => category.enabled !== false
  );
  for (const category of enabledCategories) {
    const filtered = posts.filter(
      (post) => post.category_slug === category.slug
    );
    const categoryPages = paginate(filtered, PAGE_SIZE);
    for (const page of categoryPages) {
      urls.push({
        loc: `${siteBaseUrl}/category/${category.slug}/page/${page.page}/`,
        lastmod: formatDate(),
      });
    }
  }

  const xmlEntries = urls
    .map(
      (entry) => `<url>
  <loc>${escapeHtml(entry.loc)}</loc>
  ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
</url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;
  await writeHtml(path.join(DIST_DIR, "sitemap.xml"), xml);
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    const aDate = new Date(a.published_at || a.publish_at || a.created_at || 0);
    const bDate = new Date(b.published_at || b.publish_at || b.created_at || 0);
    return bDate.getTime() - aDate.getTime();
  });
}

async function build() {
  const useMock = process.argv.includes("--mock") || !!process.env.MOCK_BUILD_DATA_PATH;
  const buildToken = process.env.BUILD_TOKEN;
  const apiBase = process.env.PUBLIC_API_BASE;

  if (!useMock) {
    if (!buildToken) throw new Error("BUILD_TOKEN is required for live builds.");
    if (!apiBase) throw new Error("PUBLIC_API_BASE is required for live builds.");
  }

  const { posts: rawPosts, categories } = await loadBuildData({
    apiBase,
    buildToken,
    useMock,
  });

  const posts = sortPosts(rawPosts);

  await resetDist();
  await generatePostPages(posts);
  await generatePostListPages(posts);
  await generateCategoryPages(posts, categories);
  await generateSitemap(posts, categories);
  await generateRobots();
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
